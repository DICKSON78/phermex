<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Wholesaler;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class WholesalerPortalSeeder extends Seeder
{
    public function run(): void
    {
        $wholesaler = Wholesaler::first();
        if (! $wholesaler) {
            return;
        }

        $user = User::updateOrCreate(
            ['email' => 'wholesaler@pharmex.com'],
            [
                'name' => $wholesaler->contact_person ?: $wholesaler->name,
                'phone' => $wholesaler->contact_phone ?: $wholesaler->phone,
                'role' => 'wholesaler',
                'user_code' => 'PHX-WHL0001',
                'is_active' => true,
                'is_verified' => true,
                'password' => Hash::make('password'),
                'manufacturer_name' => null,
            ]
        );

        $wholesaler->update(['user_id' => $user->id]);
    }
}
