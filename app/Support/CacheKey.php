<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * Driver-agnostic versioned cache keys.
 *
 * Copies taught cache version for a scope in the cache store itself, so any
 * cache driver (file, database, redis) can be used. Writing to a model bumps
 * the scope version; every read key embeds it, invalidating all related read
 * caches at once without listing individual keys.
 */
final class CacheKey
{
    /**
     * Current version token for the given scope.
     */
    public static function version(string $scope): string
    {
        return (string) Cache::remember(
            "cache:version:{$scope}",
            now()->addHour(),
            static fn () => (string) time(),
        );
    }

    /**
     * Invalidate every cached key that embeds a version for these scopes.
     */
    public static function bump(string ...$scopes): void
    {
        foreach ($scopes as $scope) {
            Cache::forget("cache:version:{$scope}");
        }
    }
}
