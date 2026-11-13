<?php

namespace Database\Seeders;

use App\Models\Drug;
use App\Models\User;
use App\Models\WholesaleInventory;
use App\Models\Wholesaler;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Creates (or refreshes) the demo wholesaler login and its trading record.
 *
 * Supply-chain screens are data-driven: with no wholesaler rows the marketplace
 * and every order step renders an empty state. Run this on an environment that
 * needs a usable supplier without importing full demo fixtures:
 *   php artisan db:seed --class=WholesalerAccountSeeder
 *
 * The seeder is idempotent — safe to run repeatedly.
 */
class WholesalerAccountSeeder extends Seeder
{
    public const EMAIL = 'wholesaler@pharmex.com';

    public const PASSWORD = 'password';

    public const WHOLESALER_ID = 'WHOLE-001';

    public function run(): void
    {
        $user = User::updateOrCreate(
            ['email' => self::EMAIL],
            [
                'name' => 'MedSupply Wholesale',
                'phone' => '+255700000060',
                'role' => 'wholesaler',
                'user_code' => 'PHX-WHL0001',
                'is_active' => true,
                'is_verified' => true,
                'email_verified_at' => now(),
                'password' => Hash::make(self::PASSWORD),
            ]
        );

        $wholesaler = Wholesaler::updateOrCreate(
            ['wholesaler_id' => self::WHOLESALER_ID],
            [
                'user_id' => $user->id,
                'name' => 'MedSupply Wholesale',
                'business_type' => 'wholesaler',
                'email' => self::EMAIL,
                'phone' => '+255700000060',
                'address' => 'Plot 12, Nyerere Road, Dar es Salaam',
                'city' => 'Dar es Salaam',
                'region' => 'Dar es Salaam',
                'country' => 'Tanzania',
                'license_number' => 'TZ-WHL-2026-001',
                'registration_number' => 'REG-WHL-2026-001',
                'bank_account' => '0123456789000',
                'bank_name' => 'CRDB Bank',
                'delivery_fee' => 5,
                'express_delivery_fee' => 12,
                'minimum_order_amount' => 50,
                'payment_terms_days' => 30,
                'accepts_credit' => true,
                'status' => 'active',
                'rating' => 4.8,
                'on_time_delivery_rate' => 98,
                'contact_person' => 'Amina Saleh',
                'contact_phone' => '+255700000061',
            ]
        );

        // Give the marketplace a small catalogue when the environment already
        // has pharmacy drugs to copy from. Ordered screens stay empty until a
        // real pharmacy places an order, but the supplier is browsable.
        $drugs = Drug::query()->where('quantity', '>', 0)->take(5)->get();
        foreach ($drugs as $index => $drug) {
            WholesaleInventory::updateOrCreate(
                [
                    'wholesaler_id' => $wholesaler->wholesaler_id,
                    'drug_id' => (string) $drug->id,
                ],
                [
                    'drug_name' => $drug->name,
                    'unit' => 'unit',
                    'pack_size' => 1,
                    'category' => $drug->category?->name,
                    'batch_number' => 'WHL-'.strtoupper(Str::random(6)),
                    'quantity_in_stock' => max(50, (int) $drug->quantity),
                    'minimum_stock_level' => 10,
                    'reorder_quantity' => 50,
                    'unit_price' => $drug->wholesale_price ?: $drug->selling_price ?: 1000,
                    'expiry_date' => now()->addYear()->toDateString(),
                    'manufacture_date' => now()->subMonth()->toDateString(),
                    'location' => 'Warehouse A',
                    'status' => 'available',
                ]
            );
        }
    }
}
