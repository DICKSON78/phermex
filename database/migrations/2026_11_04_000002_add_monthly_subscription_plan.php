<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add monthly subscription plan ($14.99 ≈ TZS 39,500 at current rate)
        DB::table('subscription_plans')->insertOrIgnore([
            'name' => 'Monthly Professional',
            'slug' => 'monthly-professional',
            'description' => 'Monthly subscription with automatic payment via bank card. Includes full access to all modules with 3-day grace period for late payments.',
            'duration_months' => 1,
            'price' => 14.99,
            'currency' => 'USD',
            'grace_period_days' => 3,
            'is_monthly' => true,
            'payment_gateway' => 'crdb_card',
            'features' => json_encode([
                'users' => 5,
                'pharmacies' => 1,
                'wholesale' => true,
                'api_access' => true,
                'priority_support' => true,
                'grace_period' => '3 days',
            ]),
            'is_active' => true,
            'sort_order' => 4,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('subscription_plans')->where('slug', 'monthly-professional')->delete();
    }
};
