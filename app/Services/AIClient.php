<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIClient
{
    protected string $baseUrl;
    protected string $token;

    public function __construct()
    {
        $this->baseUrl = config('services.ai.url', 'http://localhost:8000');
        $this->token = config('services.ai.token', '');
    }

    public function forecastDemand(int $pharmacyId, int $drugId, int $horizonDays = 30): array
    {
        $response = Http::withToken($this->token)
            ->timeout(60)
            ->post("{$this->baseUrl}/forecast/demand", [
                'pharmacy_id' => $pharmacyId,
                'drug_id' => $drugId,
                'horizon_days' => $horizonDays,
            ]);

        if ($response->failed()) {
            Log::error("AI demand forecast failed: {$response->body()}");
            throw new \Exception("AI service error: {$response->status()}");
        }

        return $response->json();
    }

    public function forecastSales(int $pharmacyId, int $horizonDays = 30): array
    {
        $response = Http::withToken($this->token)
            ->timeout(60)
            ->post("{$this->baseUrl}/forecast/sales", [
                'pharmacy_id' => $pharmacyId,
                'horizon_days' => $horizonDays,
            ]);

        return $response->json();
    }

    public function getPOSRecommendations(
        int $pharmacyId, 
        ?int $customerId, 
        array $basketDrugIds, 
        int $n = 5
    ): array
    {
        $response = Http::withToken($this->token)
            ->timeout(30)
            ->post("{$this->baseUrl}/recommend/pos", [
                'pharmacy_id' => $pharmacyId,
                'customer_id' => $customerId,
                'basket_drug_ids' => $basketDrugIds,
                'n_recommendations' => $n,
            ]);

        return $response->json();
    }
}