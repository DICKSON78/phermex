<?php

namespace Database\Seeders;

use App\Models\Pharmacy;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class MarkAllPaidPharmaciesActiveSeeder extends Seeder
{
    public function run(): void
    {
        $plan = SubscriptionPlan::where('slug', 'professional')->first()
            ?? SubscriptionPlan::where('slug', 'pro')->first();

        $changed = 0;

        foreach (Pharmacy::withTrashed()->get() as $pharmacy) {
            if ($pharmacy->payment_status !== 'paid') {
                continue;
            }

            if ($pharmacy->isActive()) {
                continue;
            }

            $end = $pharmacy->subscription_end_date
                ? max($pharmacy->subscription_end_date, now()->addMonths(12))
                : now()->addMonths(12);

            $pharmacy->update([
                'application_status' => 'approved',
                'status' => 'active',
                'is_published' => true,
                'payment_status' => 'paid',
                'subscription_start_date' => now()->subDays(2),
                'subscription_end_date' => $end,
                'trial_ends_at' => null,
                'subscription_plan_id' => $plan?->id,
                'subscription_amount' => $plan ? app(\App\Services\ExchangeRateService::class)->usdToTzs((float) $plan->price) : null,
            ]);

            Subscription::updateOrCreate(
                ['pharmacy_id' => $pharmacy->id, 'plan' => 'professional'],
                [
                    'amount' => $plan?->price ?? 200,
                    'payment_method' => 'manual',
                    'status' => 'active',
                    'start_date' => now()->subDays(2)->toDateString(),
                    'end_date' => $end->toDateString(),
                ]
            );

            $changed++;
        }

        $this->command->info("Marked {$changed} PAID pharmacies as active (subscription until 2027+).");
    }
}