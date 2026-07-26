<?php

namespace Database\Seeders;

use App\Models\Pharmacy;
use App\Models\Subscription;
use Illuminate\Database\Seeder;

class SubscriptionsSeeder extends Seeder
{
    public function run(): void
    {
        $pharmacies = Pharmacy::all();

        $plans = [
            ['plan' => 'trial', 'amount' => 0, 'status' => 'active'],
            ['plan' => 'basic', 'amount' => 49000, 'status' => 'active'],
            ['plan' => 'pro', 'amount' => 132300, 'status' => 'active'],
            ['plan' => 'enterprise', 'amount' => 441000, 'status' => 'active'],
        ];

        foreach ($pharmacies as $index => $pharmacy) {
            $plan = $plans[$index % count($plans)];

            Subscription::create([
                'pharmacy_id' => $pharmacy->id,
                'plan' => $plan['plan'],
                'amount' => $plan['amount'],
                'payment_method' => $plan['amount'] > 0 ? 'bank' : null,
                'transaction_id' => $plan['amount'] > 0 ? 'TXN-' . strtoupper(uniqid()) : null,
                'status' => $plan['status'],
                'start_date' => now()->subMonths(2),
                'end_date' => $plan['plan'] === 'trial' ? now()->addDays(7) : now()->addMonths(12),
            ]);
        }
    }
}
