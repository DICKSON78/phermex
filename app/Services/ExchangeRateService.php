<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Live USD -> TZS exchange rate.
 *
 * Subscription plans are priced in USD but charged in Tanzanian shillings, so
 * the amount a pharmacy actually pays has to follow the rate of the day. This
 * used to read a hardcoded constant (2500/2600), which meant customers were
 * charged a stale amount.
 *
 * Primary source is @fawazahmed0/currency-api: open source, no API key and 340
 * pairs including TZS. open.er-api.com is used as a fallback. The rate is
 * cached for a few hours so checkout does not call out on every request, and if
 * both sources are unreachable we fall back to the last known good rate rather
 * than failing the payment.
 */
class ExchangeRateService
{
    /** Cached for 6 hours; FX rates move slowly and this keeps checkout fast. */
    private const CACHE_KEY = 'fx:usd_tzs';

    private const CACHE_TTL_SECONDS = 21600;

    /** Only used if every remote source fails and nothing was ever cached. */
    private const LAST_RESORT_RATE = 2600.0;

    /**
     * @return float
     */
    private function lastResortRate(): float
    {
        return (float) (config('services.subscriptions.tsz_per_usd') ?: self::LAST_RESORT_RATE);
    }

    private const SOURCES = [
        // Open-source currency API, no key required.
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
        // Key-less fallback.
        'https://open.er-api.com/v6/latest/USD',
    ];

    /**
     * Tanzanian shillings per 1 USD, from the live rate where possible.
     */
    public function tzsPerUsd(): float
    {
        $cached = $this->cachedRate();

        if (is_array($cached) && isset($cached['rate']) && $cached['rate'] > 0) {
            // Still usable while fresh; refetch happens below only when stale.
            if ((time() - (int) ($cached['fetched_at'] ?? 0)) < self::CACHE_TTL_SECONDS) {
                return (float) $cached['rate'];
            }
        }

        $fresh = $this->fetchRate();

        if ($fresh !== null) {
            $this->rememberRate([
                'rate' => $fresh['rate'],
                'date' => $fresh['date'],
                'fetched_at' => time(),
            ]);

            return $fresh['rate'];
        }

        // Remote sources failed: reuse the last known rate before the hard
        // fallback, so a temporary outage cannot change a customer's price.
        if (is_array($cached) && isset($cached['rate']) && $cached['rate'] > 0) {
            Log::warning('Exchange rate fetch failed; using cached rate.', [
                'rate' => $cached['rate'],
            ]);

            return (float) $cached['rate'];
        }

        $fallback = $this->lastResortRate();

        Log::warning('Exchange rate fetch failed and no cached rate exists; using fallback.', [
            'fallback' => $fallback,
        ]);

        return $fallback;
    }

    /**
     * The rate plus the day it was published, for display to the customer.
     *
     * @return array{rate: float, date: string|null, source: string|null}
     */
    public function quote(): array
    {
        $rate = $this->tzsPerUsd();
        $cached = $this->cachedRate();

        return [
            'base' => 'USD',
            'quote' => 'TZS',
            'rate' => $rate,
            'date' => is_array($cached) ? ($cached['date'] ?? null) : null,
        ];
    }

    /**
     * Converts a USD amount to TZS at the live rate.
     */
    public function usdToTzs(float $usd): float
    {
        return round($usd * $this->tzsPerUsd());
    }

    /**
     * Cached rate, or null when the cache store is unavailable.
     */
    private function cachedRate(): ?array
    {
        try {
            $cached = Cache::get(self::CACHE_KEY);
        } catch (\Throwable $e) {
            Log::warning('Exchange rate cache unavailable.', ['error' => $e->getMessage()]);

            return null;
        }

        return is_array($cached) ? $cached : null;
    }

    private function rememberRate(array $payload): void
    {
        try {
            Cache::put(self::CACHE_KEY, $payload, self::CACHE_TTL_SECONDS * 4);
        } catch (\Throwable $e) {
            Log::warning('Could not cache exchange rate.', ['error' => $e->getMessage()]);
        }
    }

    /**
     * @return array{rate: float, date: string}|null
     */
    private function fetchRate(): ?array
    {
        foreach (self::SOURCES as $url) {
            try {
                $response = Http::timeout(6)->retry(1, 200)->get($url);

                if (! $response->successful()) {
                    continue;
                }

                $rate = $this->extractTzsRate($response->json());

                if ($rate !== null && $rate > 0) {
                    $date = (string) ($response->json('date')
                        ?? $response->json('time_last_update_utc')
                        ?? '');

                    return ['rate' => $rate, 'date' => $date !== '' ? $date : null];
                }
            } catch (\Throwable $e) {
                Log::warning('Exchange rate source failed.', [
                    'url' => $url,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return null;
    }

    /**
     * Both providers return a base-USD rate table; only the envelope differs.
     *
     * @param  array<string, mixed>|null  $payload
     */
    private function extractTzsRate(?array $payload): ?float
    {
        if (! is_array($payload)) {
            return null;
        }

        // currency-api: { "date": "...", "usd": { "tzs": 2642.24, ... } }
        if (isset($payload['usd']) && is_array($payload['usd']) && isset($payload['usd']['tzs'])) {
            return (float) $payload['usd']['tzs'];
        }

        // open.er-api.com: { "rates": { "TZS": 2648.37, ... } }
        if (isset($payload['rates']['TZS'])) {
            return (float) $payload['rates']['TZS'];
        }

        return null;
    }
}
