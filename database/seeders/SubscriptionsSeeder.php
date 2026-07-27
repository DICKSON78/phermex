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
                'created_at' => now()->subDays(rand(20, 29)),
            ]);
        }

        $extraSubscriptions = [
            ['pharmacy_id' => 1, 'plan' => 'basic', 'amount' => 49000, 'payment_method' => 'mobile', 'status' => 'active', 'start_date' => now()->subDays(25), 'end_date' => now()->addMonths(1), 'created_at' => now()->subDays(25)],
            ['pharmacy_id' => 1, 'plan' => 'pro', 'amount' => 132300, 'payment_method' => 'bank', 'status' => 'active', 'start_date' => now()->subDays(20), 'end_date' => now()->addMonths(12), 'created_at' => now()->subDays(20)],
            ['pharmacy_id' => 1, 'plan' => 'enterprise', 'amount' => 441000, 'payment_method' => 'bank', 'status' => 'active', 'start_date' => now()->subDays(18), 'end_date' => now()->addYear(), 'created_at' => now()->subDays(18)],
            ['pharmacy_id' => 1, 'plan' => 'trial', 'amount' => 0, 'payment_method' => null, 'status' => 'expired', 'start_date' => now()->subDays(30), 'end_date' => now()->subDays(23), 'created_at' => now()->subDays(30)],
            ['pharmacy_id' => 1, 'plan' => 'basic', 'amount' => 49000, 'payment_method' => 'mobile', 'status' => 'cancelled', 'start_date' => now()->subDays(28), 'end_date' => now()->addMonths(1), 'created_at' => now()->subDays(28)],
            ['pharmacy_id' => 1, 'plan' => 'pro', 'amount' => 132300, 'payment_method' => 'bank', 'status' => 'suspended', 'start_date' => now()->subDays(15), 'end_date' => now()->addMonths(12), 'created_at' => now()->subDays(15)],
            ['pharmacy_id' => 1, 'plan' => 'basic', 'amount' => 49000, 'payment_method' => 'mobile', 'status' => 'active', 'start_date' => now()->subDays(14), 'end_date' => now()->addMonths(1), 'created_at' => now()->subDays(14)],
            ['pharmacy_id' => 1, 'plan' => 'enterprise', 'amount' => 441000, 'payment_method' => 'bank', 'status' => 'active', 'start_date' => now()->subDays(12), 'end_date' => now()->addYear(), 'created_at' => now()->subDays(12)],
            ['pharmacy_id' => 1, 'plan' => 'pro', 'amount' => 132300, 'payment_method' => 'bank', 'status' => 'active', 'start_date' => now()->subDays(10), 'end_date' => now()->addMonths(12), 'created_at' => now()->subDays(10)],
            ['pharmacy_id' => 1, 'plan' => 'basic', 'amount' => 49000, 'payment_method' => 'mobile', 'status' => 'active', 'start_date' => now()->subDays(9), 'end_date' => now()->addMonths(1), 'created_at' => now()->subDays(9)],
            ['pharmacy_id' => 1, 'plan' => 'pro', 'amount' => 132300, 'payment_method' => 'bank', 'status' => 'active', 'start_date' => now()->subDays(7), 'end_date' => now()->addMonths(12), 'created_at' => now()->subDays(7)],
            ['pharmacy_id' => 1, 'plan' => 'enterprise', 'amount' => 441000, 'payment_method' => 'bank', 'status' => 'active', 'start_date' => now()->subDays(6), 'end_date' => now()->addYear(), 'created_at' => now()->subDays(6)],
            ['pharmacy_id' => 1, 'plan' => 'basic', 'amount' => 49000, 'payment_method' => 'mobile', 'status' => 'active', 'start_date' => now()->subDays(5), 'end_date' => now()->addMonths(1), 'created_at' => now()->subDays(5)],
            ['pharmacy_id' => 1, 'plan' => 'pro', 'amount' => 132300, 'payment_method' => 'bank', 'status' => 'active', 'start_date' => now()->subDays(4), 'end_date' => now()->addMonths(12), 'created_at' => now()->subDays(4)],
            ['pharmacy_id' => 1, 'plan' => 'basic', 'amount' => 49000, 'payment_method' => 'mobile', 'status' => 'expired', 'start_date' => now()->subDays(22), 'end_date' => now()->subDays(8), 'created_at' => now()->subDays(22)],
            ['pharmacy_id' => 1, 'plan' => 'enterprise', 'amount' => 441000, 'payment_method' => 'bank', 'status' => 'active', 'start_date' => now()->subDays(3), 'end_date' => now()->addYear(), 'created_at' => now()->subDays(3)],
            ['pharmacy_id' => 1, 'plan' => 'pro', 'amount' => 132300, 'payment_method' => 'bank', 'status' => 'active', 'start_date' => now()->subDays(1), 'end_date' => now()->addMonths(12), 'created_at' => now()->subDays(1)],
            ['pharmacy_id' => 1, 'plan' => 'enterprise', 'amount' => 441000, 'payment_method' => 'bank', 'status' => 'active', 'start_date' => now()->subDays(16), 'end_date' => now()->addYear(), 'created_at' => now()->subDays(16)],
            ['pharmacy_id' => 1, 'plan' => 'pro', 'amount' => 132300, 'payment_method' => 'bank', 'status' => 'cancelled', 'start_date' => now()->subDays(24), 'end_date' => now()->addMonths(12), 'created_at' => now()->subDays(24)],
            ['pharmacy_id' => 1, 'plan' => 'basic', 'amount' => 49000, 'payment_method' => 'mobile', 'status' => 'active', 'start_date' => now()->subDays(11), 'end_date' => now()->addMonths(1), 'created_at' => now()->subDays(11)],
            ['pharmacy_id' => 1, 'plan' => 'enterprise', 'amount' => 441000, 'payment_method' => 'bank', 'status' => 'active', 'start_date' => now()->subDays(13), 'end_date' => now()->addYear(), 'created_at' => now()->subDays(13)],
            ['pharmacy_id' => 1, 'plan' => 'pro', 'amount' => 132300, 'payment_method' => 'bank', 'status' => 'active', 'start_date' => now()->subDays(17), 'end_date' => now()->addMonths(12), 'created_at' => now()->subDays(17)],
            ['pharmacy_id' => 1, 'plan' => 'basic', 'amount' => 49000, 'payment_method' => 'mobile', 'status' => 'suspended', 'start_date' => now()->subDays(19), 'end_date' => now()->addMonths(1), 'created_at' => now()->subDays(19)],
            ['pharmacy_id' => 1, 'plan' => 'enterprise', 'amount' => 441000, 'payment_method' => 'bank', 'status' => 'active', 'start_date' => now()->subDays(21), 'end_date' => now()->addYear(), 'created_at' => now()->subDays(21)],
            ['pharmacy_id' => 1, 'plan' => 'pro', 'amount' => 132300, 'payment_method' => 'bank', 'status' => 'active', 'start_date' => now()->subDays(23), 'end_date' => now()->addMonths(12), 'created_at' => now()->subDays(23)],
            ['pharmacy_id' => 1, 'plan' => 'basic', 'amount' => 49000, 'payment_method' => 'mobile', 'status' => 'active', 'start_date' => now()->subDays(26), 'end_date' => now()->addMonths(1), 'created_at' => now()->subDays(26)],
            ['pharmacy_id' => 1, 'plan' => 'enterprise', 'amount' => 441000, 'payment_method' => 'bank', 'status' => 'active', 'start_date' => now()->subDays(27), 'end_date' => now()->addYear(), 'created_at' => now()->subDays(27)],
        ];

        foreach ($extraSubscriptions as $sub) {
            Subscription::create($sub);
        }
    }
}
