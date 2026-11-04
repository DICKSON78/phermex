<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add billing_period column if it doesn't exist
        if (!Schema::hasColumn('subscription_plans', 'billing_period')) {
            Schema::table('subscription_plans', function (Blueprint $table) {
                $table->string('billing_period')->default('annual')->after('duration_months');
            });
        }

        // Update existing plans to mark them as annual
        DB::table('subscription_plans')
            ->whereIn('slug', ['starter', 'professional', 'enterprise'])
            ->update(['billing_period' => 'annual']);

        // Add monthly payment options for each annual plan
        // Pricing: Monthly = higher price, Annual = discount incentive
        // STARTER: $14.99/mo = $179.88/yr (vs $150/yr annual = 16% discount for annual)
        // PROFESSIONAL: $19.99/mo = $239.88/yr (vs $200/yr annual = 16% discount for annual)
        // ENTERPRISE: $24.99/mo = $299.88/yr (vs $250/yr annual = 16% discount for annual)
        
        $monthlyPlans = [
            [
                'name' => 'STARTER Monthly',
                'slug' => 'starter-monthly',
                'description' => 'Monthly subscription - STARTER plan. Billed monthly with automatic renewal. Save 16% with annual plan.',
                'duration_months' => 1,
                'price' => 14.99,
                'billing_period' => 'monthly',
                'currency' => 'USD',
                'grace_period_days' => 3,
                'is_monthly' => true,
                'payment_gateway' => 'crdb_card',
                'features' => json_encode([
                    'users' => 3,
                    'pharmacies' => 1,
                    'wholesale' => false,
                    'api_access' => false,
                    'priority_support' => false,
                    'grace_period' => '3 days',
                ]),
                'is_active' => true,
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'PROFESSIONAL Monthly',
                'slug' => 'professional-monthly',
                'description' => 'Monthly subscription - PROFESSIONAL plan. Billed monthly with automatic renewal. Save 16% with annual plan.',
                'duration_months' => 1,
                'price' => 19.99,
                'billing_period' => 'monthly',
                'currency' => 'USD',
                'grace_period_days' => 3,
                'is_monthly' => true,
                'payment_gateway' => 'crdb_card',
                'features' => json_encode([
                    'users' => 5,
                    'pharmacies' => 2,
                    'wholesale' => true,
                    'api_access' => true,
                    'priority_support' => true,
                    'grace_period' => '3 days',
                ]),
                'is_active' => true,
                'sort_order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'ENTERPRISE Monthly',
                'slug' => 'enterprise-monthly',
                'description' => 'Monthly subscription - ENTERPRISE plan. Billed monthly with automatic renewal. Save 16% with annual plan.',
                'duration_months' => 1,
                'price' => 24.99,
                'billing_period' => 'monthly',
                'currency' => 'USD',
                'grace_period_days' => 3,
                'is_monthly' => true,
                'payment_gateway' => 'crdb_card',
                'features' => json_encode([
                    'users' => 10,
                    'pharmacies' => 5,
                    'wholesale' => true,
                    'api_access' => true,
                    'priority_support' => true,
                    'dedicated_support' => true,
                    'grace_period' => '3 days',
                ]),
                'is_active' => true,
                'sort_order' => 5,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($monthlyPlans as $plan) {
            DB::table('subscription_plans')->updateOrInsert(
                ['slug' => $plan['slug']],
                $plan
            );
        }
    }

    public function down(): void
    {
        DB::table('subscription_plans')
            ->whereIn('slug', ['starter-monthly', 'professional-monthly', 'enterprise-monthly'])
            ->delete();

        if (Schema::hasColumn('subscription_plans', 'billing_period')) {
            Schema::table('subscription_plans', function (Blueprint $table) {
                $table->dropColumn('billing_period');
            });
        }
    }
};
