<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Creates (or refreshes) the demo manufacturer login on its own.
 *
 * Run it directly when only the account is needed:
 *   php artisan db:seed --class=ManufacturerAccountSeeder
 */
class ManufacturerAccountSeeder extends Seeder
{
    public const EMAIL = 'manufacturer@pharmex.com';

    public const PASSWORD = 'password';

    public function run(): void
    {
        User::updateOrCreate(
            ['email' => self::EMAIL],
            [
                'name' => 'HealthCare Pharma',
                'phone' => '+255700000050',
                'role' => 'manufacturer',
                'user_code' => 'PHX-MFG0001',
                'is_active' => true,
                'is_verified' => true,
                // Without this the sign-in flow sends the account to the
                // email verification screen even though seeded accounts are
                // intended to be ready to use.
                'email_verified_at' => now(),
                'password' => Hash::make(self::PASSWORD),
                'manufacturer_name' => 'HealthCare Pharma',
                'manufacturer_license' => 'TZ-MFG-2026-0042',
                'manufacturer_address' => 'Plot 45, Nyerere Road, Dar es Salaam',
                'manufacturer_phone' => '+255700000050',
                'manufacturer_email' => 'info@healthcarepharma.co.tz',
                'manufacturer_website' => 'https://healthcarepharma.co.tz',
                'manufacturer_description' => 'Manufacturer of essential medicines, oral rehydration salts and antibiotics.',
            ]
        );
    }
}
