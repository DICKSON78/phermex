<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;

/**
 * Token-aware search that prefers MySQL FULLTEXT (MATCH ... AGAINST BOOLEAN)
 * and falls back to LIKE for short / mixed terms the tokenizer would drop.
 */
final class Search
{
    private const BOOLEAN_MAX_TERMS = 5;

    public static function apply(Builder $query, array $columns, string $term): void
    {
        $term = trim($term);

        if ($term === '') {
            return;
        }

        $words = preg_split('/\s+/', $term) ?: [$term];
        $words = array_values(array_filter($words, static fn (string $w) => $w !== ''));

        $fullTextSafe = count($words) <= self::BOOLEAN_MAX_TERMS
            && ! empty($words)
            && collect($words)->every(static fn (string $w) => mb_strlen($w) >= 3);

        if ($fullTextSafe) {
            $boolean = collect($words)->map(static fn (string $w) => '+'.$w.'*')->implode(' ');

            $query->whereFullText($columns, $boolean, ['mode' => 'boolean']);

            return;
        }

        $query->where(static function (Builder $q) use ($columns, $term) {
            foreach ($columns as $column) {
                $q->orWhere($column, 'like', "%{$term}%");
            }
        });
    }
}
