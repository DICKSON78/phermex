<?php

namespace App\Services;

use App\Exceptions\PaymentNotFoundAtGateway;
use Illuminate\Support\Facades\Log;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ClickPesaService
{
    /** The gateway rejects order references longer than this. */
    public const MAX_REFERENCE_LENGTH = 20;

    protected string $baseUrl;

    protected string $clientId;

    protected string $apiKey;

    protected bool $enabled;

    public function __construct()
    {
        $this->baseUrl = config('services.clickpesa.base_url', 'https://api.clickpesa.com/third-parties');
        $this->clientId = config('services.clickpesa.client_id', '');
        $this->apiKey = config('services.clickpesa.api_key', '');
        $this->enabled = (bool) config('services.clickpesa.enabled', false);
    }

    public function enabled(): bool
    {
        return $this->enabled && $this->clientId !== '' && $this->apiKey !== '';
    }

    /**
     * Authorization header for the payments endpoints.
     *
     * generate-token hands back a token that already starts with "Bearer ".
     * Passing that through Http::withToken() would send "Bearer Bearer ...",
     * which the gateway answers with 401 on every request.
     *
     * @return array<string, string>
     */
    protected function authHeaders(): array
    {
        $token = $this->accessToken();

        return [
            'Authorization' => Str::startsWith($token, 'Bearer ') ? $token : 'Bearer ' . $token,
        ];
    }

    /**
     * Build an order reference the gateway will accept: alphanumeric only, no
     * separators, and no longer than MAX_REFERENCE_LENGTH. The gateway rejects
     * anything with a hyphen, so references cannot be built with '-'.
     */
    public static function reference(string $prefix, $id = null): string
    {
        $base = strtoupper((string) preg_replace('/[^A-Z0-9]/', '', $prefix));

        if ($id !== null && $id !== '') {
            $base .= preg_replace('/[^0-9]/', '', (string) $id);
        }

        // Keep room for the random tail so references stay unique.
        $base = substr($base, 0, self::MAX_REFERENCE_LENGTH - 8);

        $suffix = strtoupper((string) preg_replace('/[^A-Z0-9]/', '', Str::random(10)));

        return substr($base . $suffix, 0, self::MAX_REFERENCE_LENGTH);
    }

    protected function accessToken(): string
    {
        $cacheKey = 'clickpesa_token';
        $fallbackKey = 'clickpesa_token_last_good';
        $ttl = 55 * 60; // tokens valid 1 hour; refresh a little early

        $cached = cache()->get($cacheKey);
        if ($cached) {
            return $cached;
        }

        // The gateway authenticates this call with headers. Sending them in the
        // JSON body is accepted-looking but always rejected, which is what made
        // every push silently fail.
        $response = Http::timeout(15)
            ->withHeaders([
                'client-id' => $this->clientId,
                'api-key' => $this->apiKey,
            ])
            ->post($this->baseUrl . '/generate-token');

        $data = $response->json();

        if (!$response->successful() || !($data['success'] ?? false) || empty($data['token'])) {
            // Before KYC the account gets 100 calls a day and generate-token
            // counts towards them, so the limit gets hit while real customers are
            // mid-payment. A token already in hand is still valid for up to an
            // hour, so use it rather than failing a payment the customer is
            // halfway through.
            $fallback = cache()->get($fallbackKey);

            if ($fallback) {
                Log::warning('ClickPesa token refresh failed, reusing the last token: ' . ($data['message'] ?? $response->status()));

                cache()->put($cacheKey, $fallback, 5 * 60);

                return $fallback;
            }

            throw new \Exception('ClickPesa: unable to obtain access token.' . (isset($data['message']) ? ' ' . $data['message'] : ''));
        }

        cache()->put($cacheKey, $data['token'], $ttl);
        // Held much longer than the token itself so a rate limit has something
        // to fall back on.
        cache()->put($fallbackKey, $data['token'], 6 * 60 * 60);

        return $data['token'];
    }

    /**
     * Normalise a local mobile number to the form the gateway expects:
     * country code, no plus sign, no separators (e.g. 255712345678).
     */
    public static function normalizePhone(?string $phone): ?string
    {
        $digits = ltrim((string) preg_replace('/[^0-9]/', '', (string) $phone), '0');

        if ($digits === '') {
            return null;
        }

        if (strlen($digits) === 9) {
            $digits = '255' . $digits;
        }

        return $digits;
    }

    /**
     * Is this a Vodacom number?
     *
     * M-PESA is not enabled on our ClickPesa account and Vodacom will not be
     * added for now, so these numbers cannot be charged. They are rejected up
     * front instead of being handed to a gateway that will silently route them
     * to another network and leave the customer waiting for a prompt that is
     * never going to arrive.
     *
     * Detection is by prefix because the gateway does not report the network of
     * a number back to us. Vodacom holds the 754-757 blocks in Tanzania.
     */
    public static function isMpesaNumber(?string $phone): bool
    {
        $digits = self::normalizePhone($phone);

        if ($digits === null) {
            return false;
        }

        if (!str_starts_with($digits, '255')) {
            return false;
        }

        $national = substr($digits, 3);

        foreach (['754', '755', '756', '757'] as $prefix) {
            if (str_starts_with($national, $prefix)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Ask the gateway what it can actually charge before committing to a push.
     *
     * The preview endpoint answers 200 even when nothing can be charged, listing
     * each method as UNAVAILABLE with the reason. That reason is the only place
     * the gateway says "M-PESA is not enabled for this merchant" or "amount
     * outside 500..3,000,000", so without asking first those failures surface
     * later as a customer who was told to approve a prompt that never came.
     *
     * @return array{available: array<int, array{name: string, fee: float}>, unavailable: array<int, array{name: string, message: string}>}
     */
    public function previewPush(string $amount, string $phoneNumber, string $orderReference): array
    {
        $phone = self::normalizePhone($phoneNumber);

        if ($phone === null) {
            throw new \Exception('ClickPesa: a valid phone number is required.');
        }

        $response = Http::timeout(20)
            ->withHeaders($this->authHeaders())
            ->asJson()
            ->post($this->baseUrl . '/payments/preview-ussd-push-request', [
                'amount' => number_format((float) $amount, 2, '.', ''),
                'currency' => 'TZS',
                'orderReference' => $orderReference,
                'phoneNumber' => $phone,
            ]);

        if (!$response->successful()) {
            throw new \Exception('ClickPesa: ' . ($response->json()['message'] ?? 'preview request failed.'));
        }

        $available = [];
        $unavailable = [];

        foreach ((array) $response->json('activeMethods', []) as $method) {
            $name = (string) ($method['name'] ?? '');

            if (($method['status'] ?? '') === 'AVAILABLE') {
                $available[] = ['name' => $name, 'fee' => (float) ($method['fee'] ?? 0)];
            } else {
                $unavailable[] = ['name' => $name, 'message' => (string) ($method['message'] ?? 'unavailable')];
            }
        }

        return ['available' => $available, 'unavailable' => $unavailable];
    }

    public function initiatePush(string $amount, string $phoneNumber, string $orderReference): array
    {
        $phone = self::normalizePhone($phoneNumber);

        if ($phone === null) {
            throw new \Exception('ClickPesa: a valid phone number is required.');
        }

        $response = Http::timeout(20)
            ->withHeaders($this->authHeaders())
            ->asJson()
            ->post($this->baseUrl . '/payments/initiate-ussd-push-request', [
                'amount' => number_format((float) $amount, 2, '.', ''),
                'currency' => 'TZS',
                'orderReference' => $orderReference,
                'phoneNumber' => $phone,
            ]);

        if (!$response->successful()) {
            throw new \Exception('ClickPesa: ' . ($response->json()['message'] ?? 'push request failed.'));
        }

        return $response->json();
    }

    /**
     * Read a payment status without spending a gateway call every time.
     *
     * The checkout screen polls while a customer waits, and each poll is a
     * metered call. Before KYC the account only gets 100 a day, so a handful of
     * customers watching their phones would use the whole day's budget. The
     * answer for a given reference cannot change faster than a few seconds, so
     * a short cache costs nothing in latency and saves the calls.
     *
     * @param bool $fresh Bypass the cache. Used by the webhook, which is the
     *                    one caller that must not read a stale answer.
     */
    public function queryStatus(string $orderReference, bool $fresh = false): array
    {
        $cacheKey = 'clickpesa_status_' . $orderReference;

        if (! $fresh) {
            $cached = cache()->get($cacheKey);

            if ($cached) {
                return $cached;
            }
        }

        $result = $this->queryGatewayStatus($orderReference);

        // Kept briefly. Payment states settle in seconds and a customer waiting
        // on a prompt should see it land, but not at the price of one call per
        // second per waiting customer.
        cache()->put($cacheKey, $result, 10);

        return $result;
    }

    private function queryGatewayStatus(string $orderReference): array
    {
        // There is no /payments/query-status endpoint. The reference is the last
        // path segment, and the gateway answers with a list, so an unwrapped read
        // of ['status'] would always look like PROCESSING and never activate.
        $response = Http::timeout(15)
            ->withHeaders($this->authHeaders())
            ->get($this->baseUrl . '/payments/' . rawurlencode($orderReference));

        if ($response->status() === 404 || $response->status() === 400) {
            // The gateway has never heard of this reference. Flagged separately
            // because answering as though it were an outage makes callers retry
            // something that can never succeed.
            throw new PaymentNotFoundAtGateway(
                'ClickPesa: no payment for reference ' . $orderReference . '.'
            );
        }

        if (!$response->successful()) {
            throw new \Exception('ClickPesa: ' . ($response->json()['message'] ?? 'status query failed.'));
        }

        $body = $response->json();

        if (is_array($body) && array_key_exists(0, $body)) {
            $body = $body[0];
        }

        return (array) $body;
    }
}
