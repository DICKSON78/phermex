<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Older registrations stored the plan's USD price (150/200/250) in the
 * `subscription_amount` column even though every screen treats that column as
 * shillings. That made a $250 plan read as "TZS 250". New rows are written in
 * TZS, and this backfills the rows created before that change.
 */
return new class extends Migration
{
    public function up(): void
    {
        $rate = app(\App\Services\ExchangeRateService::class)->tzsPerUsd();

        DB::table('pharmacies')
            ->whereNotNull('subscription_plan_id')
            ->whereNotNull('subscription_amount')
            ->where('subscription_amount', '<', 1000)
            ->update([
                'subscription_amount' => DB::raw('ROUND(subscription_amount * ' . (float) $rate . ', 2)'),
            ]);
    }

    public function down(): void
    {
        // The original USD figure cannot be recovered reliably after rates
        // move, so leave the normalised shilling amounts in place.
    }
};
