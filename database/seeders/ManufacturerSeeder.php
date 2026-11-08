<?php

namespace Database\Seeders;

use App\Models\ManufacturerCampaign;
use App\Models\ManufacturerProduct;
use App\Models\ManufacturerRecall;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ManufacturerSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'manufacturer@pharmex.com'],
            [
                'name' => 'HealthCare Pharma',
                'phone' => '+255700000050',
                'role' => 'manufacturer',
                'user_code' => 'PHX-MFG0001',
                'is_active' => true,
                'is_verified' => true,
                'password' => Hash::make('password'),
                'manufacturer_name' => 'HealthCare Pharma',
                'manufacturer_license' => 'TZ-MFG-2026-0042',
                'manufacturer_address' => 'Plot 45, Nyerere Road, Dar es Salaam',
                'manufacturer_phone' => '+255700000050',
                'manufacturer_email' => 'info@healthcarepharma.co.tz',
                'manufacturer_website' => 'https://healthcarepharma.co.tz',
                'manufacturer_description' => 'Manufacturer of essential medicines, oral rehydration salts and antibiotics.',
            ]
        );

        $products = [
            [
                'name' => 'Paracetamol 500mg',
                'generic_name' => 'Acetaminophen',
                'category' => 'Analgesics',
                'strength' => '500mg',
                'dosage_form' => 'Tablets',
                'sku' => 'HCP-PAR-500',
                'batch_number' => 'B-2401',
                'cost_price' => 90,
                'selling_price' => 150,
                'wholesale_price' => 120,
                'quantity' => 4800,
                'reorder_level' => 500,
                'expiry_date' => now()->addMonths(18)->toDateString(),
            ],
            [
                'name' => 'Amoxicillin 250mg',
                'generic_name' => 'Amoxicillin',
                'category' => 'Antibiotics',
                'strength' => '250mg',
                'dosage_form' => 'Capsules',
                'sku' => 'HCP-AMX-250',
                'batch_number' => 'B-2402',
                'cost_price' => 180,
                'selling_price' => 300,
                'wholesale_price' => 240,
                'quantity' => 2400,
                'reorder_level' => 300,
                'requires_prescription' => true,
                'expiry_date' => now()->addMonths(14)->toDateString(),
            ],
            [
                'name' => 'Oral Rehydration Salts',
                'generic_name' => 'ORS',
                'category' => 'Electrolytes',
                'strength' => '20.5g',
                'dosage_form' => 'Sachets',
                'sku' => 'HCP-ORS-020',
                'batch_number' => 'B-2403',
                'cost_price' => 350,
                'selling_price' => 500,
                'wholesale_price' => 420,
                'quantity' => 120,
                'reorder_level' => 200,
                'expiry_date' => now()->addMonths(20)->toDateString(),
            ],
            [
                'name' => 'Metformin 500mg',
                'generic_name' => 'Metformin Hydrochloride',
                'category' => 'Antidiabetics',
                'strength' => '500mg',
                'dosage_form' => 'Tablets',
                'sku' => 'HCP-MET-500',
                'batch_number' => 'B-2404',
                'cost_price' => 120,
                'selling_price' => 220,
                'wholesale_price' => 170,
                'quantity' => 3200,
                'reorder_level' => 400,
                'requires_prescription' => true,
                'expiry_date' => now()->addMonths(16)->toDateString(),
            ],
        ];

        foreach ($products as $product) {
            ManufacturerProduct::updateOrCreate(
                ['user_id' => $user->id, 'name' => $product['name']],
                array_merge($product, ['user_id' => $user->id, 'status' => 'active'])
            );
        }

        $ors = ManufacturerProduct::where('user_id', $user->id)->where('name', 'Oral Rehydration Salts')->first();

        ManufacturerRecall::updateOrCreate(
            ['user_id' => $user->id, 'recall_number' => 'RCL-2026-0001'],
            [
                'product_id' => $ors?->id,
                'product_name' => 'Oral Rehydration Salts',
                'recall_reason' => 'labeling',
                'severity' => 'class_ii',
                'batch_numbers' => 'B-2403',
                'date_issued' => now()->subDays(12)->toDateString(),
                'affected_quantity' => 300,
                'returned_quantity' => 120,
                'status' => 'in_progress',
                'notes' => 'Sachet printing error on the preparation instructions. Distributors notified.',
            ]
        );

        $paracetamol = ManufacturerProduct::where('user_id', $user->id)->where('name', 'Paracetamol 500mg')->first();
        $amoxicillin = ManufacturerProduct::where('user_id', $user->id)->where('name', 'Amoxicillin 250mg')->first();

        $campaigns = [
            [
                'name' => 'Q4 Paracetamol pharmacy push',
                'product_id' => $paracetamol?->id,
                'channel' => 'trade',
                'status' => 'active',
                'target_audience' => 'Retail pharmacies in Dar es Salaam and Mwanza',
                'description' => 'Volume discount for pharmacies ordering 50 packs or more.',
                'start_date' => now()->startOfMonth()->toDateString(),
                'end_date' => now()->addMonths(2)->endOfMonth()->toDateString(),
                'budget' => 1200000,
                'spend' => 480000,
                'impressions' => 18400,
                'clicks' => 960,
                'conversions' => 142,
            ],
            [
                'name' => 'Antibiotic stewardship awareness',
                'product_id' => $amoxicillin?->id,
                'channel' => 'in_app',
                'status' => 'scheduled',
                'target_audience' => 'Pharmacists and clinical staff',
                'description' => 'In-app education series on responsible antibiotic dispensing.',
                'start_date' => now()->addWeeks(2)->toDateString(),
                'end_date' => now()->addMonths(2)->toDateString(),
                'budget' => 600000,
                'spend' => 0,
                'impressions' => 0,
                'clicks' => 0,
                'conversions' => 0,
            ],
        ];

        foreach ($campaigns as $campaign) {
            ManufacturerCampaign::updateOrCreate(
                ['user_id' => $user->id, 'name' => $campaign['name']],
                array_merge($campaign, ['user_id' => $user->id])
            );
        }
    }
}
