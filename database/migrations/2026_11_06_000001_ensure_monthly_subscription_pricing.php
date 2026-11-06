<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Force the canonical monthly pricing.
     *
     * Older databases still carry annual rows ($150/$200/$250 for 12 months),
     * which made the pricing pages render "$150.00/yr" instead of the agreed
     * "$14.99/mo". This migration is idempotent and safe to run after the
     * earlier pricing migrations, whatever state they left behind.
     */
    public function up(): void
    {
        $plans = [
            'starter' => ['name' => 'STARTER', 'price' => 14.99],
            'professional' => ['name' => 'PROFESSIONAL', 'price' => 19.99],
            'enterprise' => ['name' => 'ENTERPRISE', 'price' => 29.99],
        ];

        $hasBillingPeriod = Schema::hasColumn('subscription_plans', 'billing_period');

        foreach ($plans as $slug => $plan) {
            $values = [
                'name' => $plan['name'],
                'price' => $plan['price'],
                'currency' => 'USD',
                'duration_months' => 1,
                'is_active' => true,
                'updated_at' => now(),
            ];

            if ($hasBillingPeriod) {
                $values['billing_period'] = 'monthly';
            }

            DB::table('subscription_plans')->updateOrInsert(['slug' => $slug], $values);
        }

        // Legacy monthly/quarterly/annual plans must never appear on sale again.
        DB::table('subscription_plans')
            ->whereNotIn('slug', array_keys($plans))
            ->update(['is_active' => false, 'updated_at' => now()]);
    }

    public function down(): void
    {
        // Pricing data is not rolled back; the canonical prices are the source
        // of truth and reverting them would reintroduce the annual prices.
    }
};
