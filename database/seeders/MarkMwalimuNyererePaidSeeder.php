<?php

namespace Database\Seeders;

use App\Models\Pharmacy;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MarkMwalimuNyererePaidSeeder extends Seeder
{
    public function run(): void
    {
        $pharmacy = Pharmacy::where('pharmacy_name', 'Mwalimu Nyerere Pharmacy')
            ->orWhere('pharmacy_name', 'like', '%Nyerere%')
            ->first();

        DB::beginTransaction();

        if (!$pharmacy) {
            $user = User::where('email', 'mwalimu.nyerere@pharmex.com')->first()
                ?? User::create([
                    'name' => 'Mwalimu Nyerere',
                    'email' => 'mwalimu.nyerere@pharmex.com',
                    'phone' => '+255700000001',
                    'role' => 'owner',
                    'user_code' => User::generateUserCode(),
                    'password' => Hash::make('password'),
                    'is_active' => true,
                ]);

            $pharmacy = Pharmacy::create([
                'owner_id' => $user->id,
                'pharmacy_name' => 'Mwalimu Nyerere Pharmacy',
                'pharmacy_code' => 'PHM-' . strtoupper(Str::random(6)),
                'pharmacy_type' => 'independent',
                'license_number' => 'LIC-NYR-2026',
                'country' => 'Tanzania',
                'region' => 'Dar es Salaam',
                'district' => 'Ilala',
                'street' => 'Sam Nujoma Road',
                'phone' => '+255700000001',
                'email' => 'mwalimu.nyerere@pharmex.com',
                'status' => 'active',
                'application_status' => 'approved',
                'is_published' => true,
                'payment_status' => 'paid',
                'trial_ends_at' => null,
            ]);

            $user->pharmacy()->attach($pharmacy->id);

            $this->command->info("Created '{$pharmacy->pharmacy_name}' (#{$pharmacy->id}) with owner {$user->email} / password");
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

        Subscription::where('pharmacy_id', $pharmacy->id)->delete();

        Subscription::create([
            'pharmacy_id' => $pharmacy->id,
            'plan' => 'professional',
            'amount' => $plan?->price ?? 200,
            'payment_method' => 'manual',
            'transaction_id' => 'TXN-NYR-PAID-' . strtoupper(uniqid()),
            'status' => 'active',
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
        ]);

        DB::commit();

        $this->command->info("Marked '{$pharmacy->pharmacy_name}' (#{$pharmacy->id}) as PAID — Professional plan active until {$end->toDateString()}.");
    }
}