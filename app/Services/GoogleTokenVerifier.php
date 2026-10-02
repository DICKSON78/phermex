<?php

namespace App\Services;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Verifies Google ID tokens coming from "Sign in with Google".
 *
 * Two kinds of token reach us:
 *  - Firebase ID tokens (the web dashboard uses the Firebase JS SDK). These are
 *    issued by https://securetoken.google.com/<project> and signed by Google's
 *    securetoken service account.
 *  - Plain Google ID tokens (Android's google_sign_in returns one of these).
 *    These are issued by accounts.google.com and signed by Google's OAuth
 *    service account.
 *
 * Both are checked against Google's published public keys, and the audience is
 * restricted to this project's client IDs so a token minted for another project
 * cannot be replayed against us.
 */
class GoogleTokenVerifier
{
    private const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

    /** Google rotates keys daily; caching for an hour keeps logins fast. */
    private const CERTS_CACHE_KEY = 'google:id_token_certs';

    private const CERTS_TTL_SECONDS = 3600;

    private const CLOCK_SKEW_SECONDS = 60;

    /**
     * @return array{sub: string, email: string, email_verified: bool, name: ?string, picture: ?string, iss: string, aud: string}
     *
     * @throws \InvalidArgumentException when the token is missing, malformed or not ours
     */
    public function verify(string $idToken): array
    {
        if (trim($idToken) === '') {
            throw new \InvalidArgumentException('Google ID token is required.');
        }

        try {
            $claims = (array) JWT::decode(
                $idToken,
                JWK::parseKeySet($this->certs()),
                'RS256'
            );
        } catch (Throwable $e) {
            throw new \InvalidArgumentException('Google ID token could not be verified.', 0, $e);
        }

        // exp / nbf / iat are validated by the library, but enforce the allowed
        // issuers and audience explicitly as well.
        $allowedIssuers = $this->allowedIssuers();
        $issuer = (string) ($claims['iss'] ?? '');
        if (! in_array($issuer, $allowedIssuers, true)) {
            throw new \InvalidArgumentException('Google ID token was issued by an unexpected party.');
        }

        $audience = (string) ($claims['aud'] ?? '');
        if (! in_array($audience, $this->allowedAudiences(), true)) {
            throw new \InvalidArgumentException('Google ID token was not issued for this application.');
        }

        $email = strtolower(trim((string) ($claims['email'] ?? '')));
        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('Google ID token does not contain a usable email address.');
        }

        if (($claims['email_verified'] ?? false) !== true
            && ! in_array($claims['email_verified'] ?? null, [true, 1, 'true'], true)) {
            throw new \InvalidArgumentException('The Google account email is not verified.');
        }

        return [
            'sub' => (string) ($claims['sub'] ?? ''),
            'email' => $email,
            'email_verified' => true,
            'name' => $claims['name'] ?? null,
            'picture' => $claims['picture'] ?? null,
            'iss' => $issuer,
            'aud' => $audience,
        ];
    }

    /**
     * Client IDs this project may present. The web app id, the Android app id
     * and the OAuth client ids all appear in google-services.json.
     *
     * @return array<int, string>
     */
    private function allowedAudiences(): array
    {
        $configured = array_filter(array_map(
            'trim',
            explode(',', (string) config('services.google.allowed_audiences', ''))
        ));

        $allowed = [];
        foreach ($configured as $audience) {
            $allowed[] = $audience;
        }

        $appId = (string) config('services.google.firebase_app_id', '');
        if ($appId !== '') {
            $allowed[] = $appId;
        }

        return array_values(array_unique($allowed));
    }

    /**
     * @return array<int, string>
     */
    private function allowedIssuers(): array
    {
        $projectId = (string) config('services.google.firebase_project_id', '');
        $issuers = ['accounts.google.com'];

        if ($projectId !== '') {
            $issuers[] = 'https://securetoken.google.com/'.$projectId;
        }

        return $issuers;
    }

    /**
     * Google's public signing keys, cached locally.
     */
    private function certs(): array
    {
        try {
            $cached = Cache::get(self::CERTS_CACHE_KEY);
            if (is_array($cached) && ! empty($cached)) {
                return $cached;
            }
        } catch (Throwable $e) {
            // A broken cache store must not block sign-in; fall through to the
            // network fetch.
        }

        try {
            $response = Http::timeout(8)->retry(2, 200)->get(self::GOOGLE_CERTS_URL);
            $certs = $response->successful() ? $response->json() : null;
        } catch (Throwable $e) {
            Log::warning('Could not fetch Google ID token signing keys.', ['error' => $e->getMessage()]);
            $certs = null;
        }

        if (! is_array($certs) || empty($certs['keys'])) {
            throw new \RuntimeException('Google sign-in is temporarily unavailable. Please try again.');
        }

        try {
            Cache::put(self::CERTS_CACHE_KEY, $certs, self::CERTS_TTL_SECONDS);
        } catch (Throwable $e) {
            // Cache store problems must not break sign-in.
        }

        return $certs;
    }
}
