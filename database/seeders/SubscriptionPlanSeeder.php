<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => '1 Month',
                'slug' => 'monthly',
                'description' => 'Perfect for trying out Pharmex. Full access for 1 month.',
                'duration_months' => 1,
                'price' => 49000,
                'currency' => 'TZS',
                'features' => ['Full POS access', 'Inventory management', 'Customer management', 'Basic reports', 'Delivery tracking', 'Chat support'],
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => '3 Months',
                'slug' => 'quarterly',
                'description' => 'Best value for growing pharmacies. Save 10% compared to monthly.',
                'duration_months' => 3,
                'price' => 132300,
                'currency' => 'TZS',
                'features' => ['Full POS access', 'Inventory management', 'Customer management', 'Advanced reports', 'Delivery tracking', 'Chat support', 'Priority support'],
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => '6 Months',
                'slug' => 'semi-annual',
                'description' => 'For established pharmacies. Save 15% compared to monthly.',
                'duration_months' => 6,
                'price' => 249900,
                'currency' => 'TZS',
                'features' => ['Full POS access', 'Inventory management', 'Customer management', 'Advanced reports', 'Delivery tracking', 'Chat support', 'Priority support', 'Analytics dashboard'],
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => '12 Months',
                'slug' => 'annual',
                'description' => 'Best for pharmacies committed to growth. Save 25% compared to monthly.',
                'duration_months' => 12,
                'price' => 441000,
                'currency' => 'TZS',
                'features' => ['Full POS access', 'Inventory management', 'Customer management', 'Advanced reports', 'Delivery tracking', 'Chat support', 'Dedicated support', 'Analytics dashboard', 'Multi-staff accounts', 'API access'],
                'is_active' => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['slug' => $plan['slug']],
                $plan
            );
        }
    }
}
