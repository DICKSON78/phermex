<?php

namespace Database\Seeders;

use App\Models\Drug;
use App\Models\Pharmacy;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DodomaPharmaciesSeeder extends Seeder
{
    public function run(): void
    {
        $pharmacies = [
            [
                'pharmacy_name' => 'Dodoma City Pharmacy',
                'pharmacy_code' => 'PHM-000101',
                'license_number' => 'TZ-PH-2026-00101',
                'pharmacy_type' => 'independent',
                'business_category' => 'Retail Pharmacy',
                'district' => 'Dodoma MC',
                'ward' => 'Madukani',
                'street' => 'Uhuru Street, City Centre',
                'latitude' => -6.1638,
                'longitude' => 35.7525,
                'phone' => '+255719100101',
                'email' => 'info@dodomacitypharmacy.com',
                'description' => 'Central pharmacy in the heart of Dodoma city serving residents and travellers with a full range of medicines.',
            ],
            [
                'pharmacy_name' => 'Viwandani Health Pharmacy',
                'pharmacy_code' => 'PHM-000102',
                'license_number' => 'TZ-PH-2026-00102',
                'pharmacy_type' => 'independent',
                'business_category' => 'Community Pharmacy',
                'district' => 'Dodoma MC',
                'ward' => 'Viwandani',
                'street' => 'Iringa Road',
                'latitude' => -6.1780,
                'longitude' => 35.7500,
                'phone' => '+255719100102',
                'email' => 'info@viwandanipharmacy.com',
                'description' => 'Community pharmacy along Iringa Road offering chronic care medicines and daily essentials.',
            ],
            [
                'pharmacy_name' => 'Nzuguni Medical Pharmacy',
                'pharmacy_code' => 'PHM-000103',
                'license_number' => 'TZ-PH-2026-00103',
                'pharmacy_type' => 'independent',
                'business_category' => 'Medical Pharmacy',
                'district' => 'Dodoma MC',
                'ward' => 'Nzuguni',
                'street' => 'Nzuguni Road',
                'latitude' => -6.1530,
                'longitude' => 35.7700,
                'phone' => '+255719100103',
                'email' => 'info@nzugunipharmacy.com',
                'description' => 'Neighbourhood pharmacy in Nzuguni focused on affordable prescriptions and family health.',
            ],
            [
                'pharmacy_name' => 'Miyuji Pharmacy Plus',
                'pharmacy_code' => 'PHM-000104',
                'license_number' => 'TZ-PH-2026-00104',
                'pharmacy_type' => 'independent',
                'business_category' => 'Retail Pharmacy',
                'district' => 'Dodoma MC',
                'ward' => 'Miyuji',
                'street' => 'Miyuji Area Road',
                'latitude' => -6.1750,
                'longitude' => 35.7320,
                'phone' => '+255719100104',
                'email' => 'info@miyujipharmacy.com',
                'description' => 'Modern retail pharmacy in Miyuji with a wide selection of over-the-counter products.',
            ],
            [
                'pharmacy_name' => 'Kikuyu Pharmacy',
                'pharmacy_code' => 'PHM-000105',
                'license_number' => 'TZ-PH-2026-00105',
                'pharmacy_type' => 'independent',
                'business_category' => 'Community Pharmacy',
                'district' => 'Dodoma MC',
                'ward' => 'Kikuyu',
                'street' => 'Kikuyu Avenue',
                'latitude' => -6.1510,
                'longitude' => 35.7410,
                'phone' => '+255719100105',
                'email' => 'info@kikuyupharmacy.com',
                'description' => 'Trusted pharmacy in Kikuyu area providing prompt service for everyday medicines.',
            ],
            [
                'pharmacy_name' => 'Kizota Health Centre Pharmacy',
                'pharmacy_code' => 'PHM-000106',
                'license_number' => 'TZ-PH-2026-00106',
                'pharmacy_type' => 'hospital',
                'business_category' => 'Medical Centre',
                'district' => 'Dodoma MC',
                'ward' => 'Kizota',
                'street' => 'Kizota Area',
                'latitude' => -6.1450,
                'longitude' => 35.7180,
                'phone' => '+255719100106',
                'email' => 'info@kizotapharmacy.com',
                'description' => 'Medical centre pharmacy in Kizota offering prescription blends and specialist medications.',
            ],
            [
                'pharmacy_name' => 'Nala Community Pharmacy',
                'pharmacy_code' => 'PHM-000107',
                'license_number' => 'TZ-PH-2026-00107',
                'pharmacy_type' => 'independent',
                'business_category' => 'Community Pharmacy',
                'district' => 'Dodoma MC',
                'ward' => 'Nala',
                'street' => 'Nala Road',
                'latitude' => -6.1730,
                'longitude' => 35.7700,
                'phone' => '+255719100107',
                'email' => 'info@nalapharmacy.com',
                'description' => 'Community pharmacy serving the Nala neighbourhood with essential medicines.',
            ],
            [
                'pharmacy_name' => 'Hombolo Pharmacy',
                'pharmacy_code' => 'PHM-000108',
                'license_number' => 'TZ-PH-2026-00108',
                'pharmacy_type' => 'independent',
                'business_category' => 'Retail Pharmacy',
                'district' => 'Chamwino DC',
                'ward' => 'Hombolo',
                'street' => 'Hombolo Village Road',
                'latitude' => -6.1300,
                'longitude' => 35.7900,
                'phone' => '+255719100108',
                'email' => 'info@hombolopharmacy.com',
                'description' => 'Rural pharmacy in the Hombolo area improving medicine access for surrounding villages.',
            ],
            [
                'pharmacy_name' => 'Makole Pharmacy',
                'pharmacy_code' => 'PHM-000109',
                'license_number' => 'TZ-PH-2026-00109',
                'pharmacy_type' => 'independent',
                'business_category' => 'Retail Pharmacy',
                'district' => 'Dodoma MC',
                'ward' => 'Makole',
                'street' => 'Barabara ya Makonde',
                'latitude' => -6.1760,
                'longitude' => 35.7420,
                'phone' => '+255719100109',
                'email' => 'info@makolepharmacy.com',
                'description' => 'Convenient retail pharmacy on Barabara ya Makonde with competitive prices on common drugs.',
            ],
            [
                'pharmacy_name' => 'UDOM Campus Pharmacy',
                'pharmacy_code' => 'PHM-000110',
                'license_number' => 'TZ-PH-2026-00110',
                'pharmacy_type' => 'independent',
                'business_category' => 'Retail Pharmacy',
                'district' => 'Dodoma MC',
                'ward' => 'Chamwino',
                'street' => 'University of Dodoma Area',
                'latitude' => -6.2140,
                'longitude' => 35.7720,
                'phone' => '+255719100110',
                'email' => 'info@udompharmacy.com',
                'description' => 'Student-friendly pharmacy near the University of Dodoma campus offering health products and wellness items.',
            ],
        ];

        foreach ($pharmacies as $data) {
            $meta = [
                'owner_id' => 2,
                'country' => 'Tanzania',
                'region' => 'Dodoma',
                'working_days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                'working_hours' => ['open' => '08:00', 'close' => '20:00'],
            ];
            $data['opening_capital'] = rand(30000, 90000);
            $data['monthly_revenue'] = rand(8000, 22000);
            $data['status'] = 'active';
            $data['application_status'] = 'approved';
            $data['is_published'] = true;
            $data['license_expiry'] = '2027-12-31';
            $data['subscription_expires_at'] = now()->addYear();

            $pharmacy = new Pharmacy();
            $pharmacy->fill(array_merge($meta, $data));
            $pharmacy->save();

            $this->seedDrugsForPharmacy($pharmacy->id);
        }
    }

    private function seedDrugsForPharmacy(int $pharmacyId): void
    {
        $drugs = [
            ['name' => 'Amoxicillin 500mg', 'generic_name' => 'Amoxicillin', 'category_id' => 1, 'description' => 'Antibiotic for bacterial infections', 'manufacturer' => 'Generic Pharma Ltd', 'barcode' => 'PHX-' . $pharmacyId . '-AMX500', 'buying_price' => 5.00, 'selling_price' => 8.50, 'wholesale_price' => 7.00, 'quantity' => 120, 'unit' => 'capsules', 'reorder_level' => 20, 'expiry_date' => '2026-12-15', 'batch_number' => 'BATCH-DDM-001', 'requires_prescription' => true],
            ['name' => 'Paracetamol 500mg', 'generic_name' => 'Acetaminophen', 'category_id' => 2, 'description' => 'Pain relief and fever reducer', 'manufacturer' => 'HealthCare Ltd', 'barcode' => 'PHX-' . $pharmacyId . '-PAR500', 'buying_price' => 1.50, 'selling_price' => 3.00, 'wholesale_price' => 2.25, 'quantity' => 260, 'unit' => 'tablets', 'reorder_level' => 40, 'expiry_date' => '2027-06-20', 'batch_number' => 'BATCH-DDM-002', 'requires_prescription' => false],
            ['name' => 'Cetirizine 10mg', 'generic_name' => 'Cetirizine HCl', 'category_id' => 6, 'description' => 'Antihistamine for allergies', 'manufacturer' => 'AllergyFree Labs', 'barcode' => 'PHX-' . $pharmacyId . '-CET010', 'buying_price' => 2.00, 'selling_price' => 4.50, 'wholesale_price' => 3.25, 'quantity' => 150, 'unit' => 'tablets', 'reorder_level' => 25, 'expiry_date' => '2027-03-25', 'batch_number' => 'BATCH-DDM-003', 'requires_prescription' => false],
            ['name' => 'Metformin 850mg', 'generic_name' => 'Metformin Hydrochloride', 'category_id' => 4, 'description' => 'First-line medication for type 2 diabetes', 'manufacturer' => 'DiabetCare Labs', 'barcode' => 'PHX-' . $pharmacyId . '-MET850', 'buying_price' => 4.00, 'selling_price' => 7.00, 'wholesale_price' => 5.50, 'quantity' => 180, 'unit' => 'tablets', 'reorder_level' => 20, 'expiry_date' => '2026-08-10', 'batch_number' => 'BATCH-DDM-004', 'requires_prescription' => true],
            ['name' => 'Vitamin C 1000mg', 'generic_name' => 'Ascorbic Acid', 'category_id' => 5, 'description' => 'Vitamin C supplement for immunity', 'manufacturer' => 'NutriVita Ltd', 'barcode' => 'PHX-' . $pharmacyId . '-VTC1000', 'buying_price' => 3.00, 'selling_price' => 6.50, 'wholesale_price' => 4.75, 'quantity' => 200, 'unit' => 'tablets', 'reorder_level' => 25, 'expiry_date' => '2027-11-15', 'batch_number' => 'BATCH-DDM-005', 'requires_prescription' => false],
        ];

        foreach ($drugs as $drug) {
            Drug::create([
                'pharmacy_id' => $pharmacyId,
                'slug' => Str::slug($drug['name']) . '-' . $pharmacyId,
                'is_generic' => true,
                'is_published' => true,
                ...$drug,
            ]);
        }
    }
}