<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class ClickPesaService
{
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

    public function initiatePush(string $amount, string $phoneNumber, string $orderReference): array
    {
        $phone = self::normalizePhone($phoneNumber);

        if ($phone === null) {
            throw new \Exception('ClickPesa: a valid phone number is required.');
        }

        $response = Http::timeout(20)
            ->withToken($this->accessToken())
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
            ->withToken($this->accessToken())
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
