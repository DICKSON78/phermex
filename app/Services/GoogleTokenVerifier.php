<?php

namespace App\Services;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
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

    /**
     * Firebase ID tokens are signed by the securetoken service account, whose
     * public keys are published separately from the OAuth keys above. The web
     * sign-in popup mints Firebase tokens, so these are the keys that actually
     * verify them.
     */
    private const FIREBASE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

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

        // Outside the try below: failing to fetch the signing keys is a server-side
        // outage and must stay a 500, not be reported as a bad token.
        $keys = $this->certs();

        try {
            $claims = (array) JWT::decode(
                $idToken,
                $keys,
                'RS256',
                self::CLOCK_SKEW_SECONDS
            );
        } catch (\UnexpectedValueException | \InvalidArgumentException | \DomainException $e) {
            // php-jwt reports an unknown kid, a bad signature and clock drift
            // as different exception types but all of them land here, and each
            // needs a different fix. Name it instead of returning a bare 401.
            throw new \InvalidArgumentException('Google ID token could not be verified: '.$e->getMessage(), 0, $e);
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
        if ($audience !== '' && ! in_array($audience, $this->allowedAudiences(), true)) {
            // Name the issuer and audience we actually received: this is the one
            // failure that depends on how the token was minted, and guessing at
            // it from the outside is slow and error prone.
            throw new \InvalidArgumentException(sprintf(
                'Google ID token was not issued for this application (iss=%s, aud=%s).',
                $issuer !== '' ? $issuer : 'none',
                $audience !== '' ? $audience : 'none'
            ));
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

        // ID tokens from the Firebase web SDK carry the Web API key as `aud`.
        $webApiKey = (string) config('services.google.firebase_web_api_key', '');
        if ($webApiKey !== '') {
            $allowed[] = $webApiKey;
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
     * Google's public signing keys, as a kid => Key map ready for JWT::decode().
     *
     * Two sources have to be merged. Plain Google ID tokens are signed by
     * Google's OAuth service account and verified with the JWK set from
     * GOOGLE_CERTS_URL. Firebase ID tokens, which is what the web popup
     * returns, are signed by the securetoken service account and published as
     * PEM certificates keyed by kid. Verifying only one of the two makes every
     * token from the other fail its signature check.
     *
     * @return array<string, Key>
     */
    private function certs(): array
    {
        $keys = [];
        $payload = $this->rawCerts();

        if (is_array($payload['jwk'] ?? null) && ! empty($payload['jwk']['keys'])) {
            try {
                $keys += JWK::parseKeySet($payload['jwk']);
            } catch (Throwable $e) {
                Log::warning('Could not parse Google OAuth signing keys.', ['error' => $e->getMessage()]);
            }
        }

        foreach ((array) ($payload['firebase'] ?? []) as $kid => $certificate) {
            if (is_string($certificate) && str_contains($certificate, 'BEGIN CERTIFICATE')) {
                $keys[(string) $kid] = new Key($certificate, 'RS256');
            }
        }

        if ($keys === []) {
            throw new \RuntimeException('Google sign-in is temporarily unavailable. Please try again.');
        }

        return $keys;
    }

    /**
     * Raw signing key material, cached. Certificates cannot be cached as Key
     * objects because a JWK derived key holds an OpenSSL handle that does not
     * survive serialisation, so the raw payloads are cached and rebuilt.
     *
     * @return array{jwk: ?array, firebase: ?array}
     */
    private function rawCerts(): array
    {
        try {
            $cached = Cache::get(self::CERTS_CACHE_KEY);
            // Ignore anything cached before this shape existed: a bare JWK set
            // from the old single-source fetch would parse as empty and turn
            // every sign-in into a 500 until the hour-long TTL expired.
            if (is_array($cached) && (isset($cached['jwk']) || isset($cached['firebase']))) {
                return $cached + ['jwk' => null, 'firebase' => null];
            }
        } catch (Throwable $e) {
            // A broken cache store must not block sign-in; fall through to the
            // network fetch.
        }

        $payload = ['jwk' => null, 'firebase' => null];

        try {
            $response = Http::timeout(8)->retry(2, 200)->get(self::GOOGLE_CERTS_URL);
            $payload['jwk'] = $response->successful() ? $response->json() : null;
        } catch (Throwable $e) {
            Log::warning('Could not fetch Google OAuth signing keys.', ['error' => $e->getMessage()]);
        }

        try {
            $response = Http::timeout(8)->retry(2, 200)->get(self::FIREBASE_CERTS_URL);
            $firebase = $response->successful() ? $response->json() : null;
            $payload['firebase'] = is_array($firebase) ? $firebase : null;
        } catch (Throwable $e) {
            Log::warning('Could not fetch Firebase signing keys.', ['error' => $e->getMessage()]);
        }

        if (empty($payload['jwk']) && empty($payload['firebase'])) {
            throw new \RuntimeException('Google sign-in is temporarily unavailable. Please try again.');
        }

        try {
            Cache::put(self::CERTS_CACHE_KEY, $payload, self::CERTS_TTL_SECONDS);
        } catch (Throwable $e) {
            // Cache store problems must not break sign-in.
        }

        return $payload;
    }
}
