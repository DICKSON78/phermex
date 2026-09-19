<?php

namespace Database\Seeders;

use App\Models\Pharmacy;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class MarkDodomaCityPaidSeeder extends Seeder
{
    public function run(): void
    {
        $pharmacy = Pharmacy::where('pharmacy_name', 'Dodoma City Pharmacy')->first();

        if (!$pharmacy) {
            $this->command->warn('Dodoma City Pharmacy not found — run DodomaPharmaciesSeeder first (php artisan db:seed --class=DodomaPharmaciesSeeder).');
            return;
        }

        $plan = SubscriptionPlan::where('slug', 'professional')->first()
            ?? SubscriptionPlan::where('slug', 'pro')->first();

        $start = now()->subDays(2);
        $end = now()->addYears(1);

        $pharmacy->update([
            'application_status' => 'approved',
            'status' => 'active',
            'is_published' => true,
            'payment_status' => 'paid',
            'subscription_start_date' => $start,
            'subscription_end_date' => $end,
            'trial_ends_at' => null,
            'subscription_plan_id' => $plan?->id,
            'subscription_amount' => $plan?->price,
        ]);

        // Replace any previous mock subscription rows with one clean active
        // Professional subscription so /subscriptions/status returns plan
        // "professional" and the full module set unlocks in the dashboard.
        Subscription::where('pharmacy_id', $pharmacy->id)->delete();

        Subscription::create([
            'pharmacy_id' => $pharmacy->id,
            'plan' => 'professional',
            'amount' => $plan?->price ?? 200,
            'payment_method' => 'manual',
            'transaction_id' => 'TXN-DDM-PAID-' . strtoupper(uniqid()),
            'status' => 'active',
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
        ]);

        $this->command->info("Marked '{$pharmacy->pharmacy_name}' (#{$pharmacy->id}) as PAID — Professional plan active until {$end->toDateString()}.");
    }
}