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

        $response = Http::asJson()->post($this->baseUrl . '/generate-token', [
            'client-id' => $this->clientId,
            'api-key' => $this->apiKey,
        ]);

        $data = $response->json();

        if (!$response->successful() || empty($data['token'])) {
            throw new \Exception('ClickPesa: unable to obtain access token.');
        }

        cache()->put($cacheKey, $data['token'], $ttl);

        return $data['token'];
    }

    public function initiatePush(string $amount, string $phoneNumber, string $orderReference): array
    {
        $response = Http::withToken($this->accessToken())
            ->asJson()
            ->post($this->baseUrl . '/payments/initiate-ussd-push-request', [
                'amount' => number_format((float) $amount, 2, '.', ''),
                'currency' => 'TZS',
                'orderReference' => $orderReference,
                'phoneNumber' => $phoneNumber,
            ]);

        if (!$response->successful()) {
            throw new \Exception('ClickPesa: ' . ($response->json()['message'] ?? 'push request failed.'));
        }

        return $response->json();
    }

    public function queryStatus(string $orderReference): array
    {
        $response = Http::withToken($this->accessToken())
            ->asJson()
            ->post($this->baseUrl . '/payments/query-status', [
                'orderReference' => $orderReference,
            ]);

        if (!$response->successful()) {
            throw new \Exception('ClickPesa: ' . ($response->json()['message'] ?? 'status query failed.'));
        }

        return $response->json();
    }
}
