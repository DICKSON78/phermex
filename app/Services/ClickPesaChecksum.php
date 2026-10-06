<?php

namespace App\Services;

/**
 * Payload checksum for ClickPesa webhooks.
 *
 * Follows the canonicalisation the gateway documents: sort every object key
 * recursively, drop the checksum and checksumMethod fields, serialise compactly,
 * then HMAC-SHA256 with the merchant checksum key.
 *
 * The webhook carries this value inside the payload. Verifying it against the
 * raw request body with a signature header, which is what this did before, means
 * every callback the gateway sends is rejected as a forged request.
 */
class ClickPesaChecksum
{
    public static function canonicalize($value)
    {
        if (!is_array($value)) {
            return $value;
        }

        // A sequential array is a JSON list and must keep its order. Sorting it
        // would reorder arrays the merchant signed as-is.
        if ($value === [] || array_values($value) === $value) {
            return array_map([self::class, 'canonicalize'], $value);
        }

        ksort($value);

        $sorted = [];

        foreach ($value as $key => $item) {
            $sorted[$key] = self::canonicalize($item);
        }

        return $sorted;
    }

    public static function create(string $key, array $payload): string
    {
        unset($payload['checksum'], $payload['checksumMethod']);

        $json = json_encode(self::canonicalize($payload), JSON_UNESCAPED_SLASHES);

        return hash_hmac('sha256', $json, $key);
    }

    /**
     * A payload with no checksum is only accepted when the account has checksum
     * signing switched off, which is why the caller passes $enforce separately.
     */
    public static function verify(string $key, array $payload, bool $enforce = true): bool
    {
        $received = $payload['checksum'] ?? null;

        if (!is_string($received) || $received === '') {
            return !$enforce;
        }

        return hash_equals(self::create($key, $payload), strtolower($received));
    }
}
