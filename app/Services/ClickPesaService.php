<?php

namespace App\Services;

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
            throw new \Exception('ClickPesa: unable to obtain access token.');
        }

        cache()->put($cacheKey, $data['token'], $ttl);

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

    public function queryStatus(string $orderReference): array
    {
        // There is no /payments/query-status endpoint. The reference is the last
        // path segment, and the gateway answers with a list, so an unwrapped read
        // of ['status'] would always look like PROCESSING and never activate.
        $response = Http::timeout(15)
            ->withHeaders($this->authHeaders())
            ->get($this->baseUrl . '/payments/' . rawurlencode($orderReference));

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
