<?php

namespace Database\Seeders;

use App\Models\Drug;
use App\Models\DrugCategory;
use App\Models\Pharmacy;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class NearbyPharmaciesSeeder extends Seeder
{
    public function run(): void
    {
        $pharmacies = [
            [
                'owner_id' => 2,
                'pharmacy_name' => 'Kariakoo Pharmacy',
                'pharmacy_code' => 'PHM-000002',
                'license_number' => 'TZ-PH-2026-0043',
                'pharmacy_type' => 'independent',
                'business_category' => 'Retail Pharmacy',
                'country' => 'Tanzania',
                'region' => 'Dar es Salaam',
                'district' => 'Ilala',
                'ward' => 'Kariakoo',
                'street' => 'Kariakoo Market Road',
                'latitude' => -6.7855,
                'longitude' => 39.2085,
                'phone' => '+255700000002',
                'email' => 'info@kariakoopharmacy.com',
                'description' => 'Conveniently located near Kariakoo Market, offering a wide range of affordable medicines and health products.',
                'working_days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                'working_hours' => ['open' => '08:00', 'close' => '20:00'],
                'opening_capital' => 45000.00,
                'monthly_revenue' => 11000.00,
                'status' => 'active',
                'is_published' => true,
                'license_expiry' => '2027-12-31',
                'subscription_expires_at' => now()->addYear(),
            ],
            [
                'owner_id' => 2,
                'pharmacy_name' => 'Mikocheni Health Pharmacy',
                'pharmacy_code' => 'PHM-000003',
                'license_number' => 'TZ-PH-2026-0044',
                'pharmacy_type' => 'independent',
                'business_category' => 'Retail Pharmacy',
                'country' => 'Tanzania',
                'region' => 'Dar es Salaam',
                'district' => 'Kinondoni',
                'ward' => 'Mikocheni B',
                'street' => 'Mikocheni Road',
                'latitude' => -6.7745,
                'longitude' => 39.2465,
                'phone' => '+255700000003',
                'email' => 'info@mikochenipharmacy.com',
                'description' => 'A modern pharmacy in Mikocheni B, specializing in chronic disease medications and wellness products.',
                'working_days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                'working_hours' => ['open' => '08:00', 'close' => '20:00'],
                'opening_capital' => 55000.00,
                'monthly_revenue' => 14500.00,
                'status' => 'active',
                'is_published' => true,
                'license_expiry' => '2027-12-31',
                'subscription_expires_at' => now()->addYear(),
            ],
            [
                'owner_id' => 2,
                'pharmacy_name' => 'Oysterbay Medical Centre',
                'pharmacy_code' => 'PHM-000004',
                'license_number' => 'TZ-PH-2026-0045',
                'pharmacy_type' => 'independent',
                'business_category' => 'Medical Centre',
                'country' => 'Tanzania',
                'region' => 'Dar es Salaam',
                'district' => 'Kinondoni',
                'ward' => 'Oysterbay',
                'street' => 'Oysterbay Road',
                'latitude' => -6.7698,
                'longitude' => 39.2855,
                'phone' => '+255700000004',
                'email' => 'info@oysterbaymedical.com',
                'description' => 'Premium medical centre pharmacy in Oysterbay offering consultation services and specialty medications.',
                'working_days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                'working_hours' => ['open' => '08:00', 'close' => '20:00'],
                'opening_capital' => 75000.00,
                'monthly_revenue' => 18000.00,
                'status' => 'active',
                'is_published' => true,
                'license_expiry' => '2027-12-31',
                'subscription_expires_at' => now()->addYear(),
            ],
            [
                'owner_id' => 2,
                'pharmacy_name' => 'Temeke Community Pharmacy',
                'pharmacy_code' => 'PHM-000005',
                'license_number' => 'TZ-PH-2026-0046',
                'pharmacy_type' => 'independent',
                'business_category' => 'Community Pharmacy',
                'country' => 'Tanzania',
                'region' => 'Dar es Salaam',
                'district' => 'Temeke',
                'ward' => 'Temeke',
                'street' => 'Temeke Junction Road',
                'latitude' => -6.8550,
                'longitude' => 39.2770,
                'phone' => '+255700000005',
                'email' => 'info@temekepharmacy.com',
                'description' => 'Trusted community pharmacy in Temeke providing essential medicines and healthcare advice to the local community.',
                'working_days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                'working_hours' => ['open' => '08:00', 'close' => '20:00'],
                'opening_capital' => 35000.00,
                'monthly_revenue' => 9500.00,
                'status' => 'active',
                'is_published' => true,
                'license_expiry' => '2027-12-31',
                'subscription_expires_at' => now()->addYear(),
            ],
            [
                'owner_id' => 2,
                'pharmacy_name' => 'Sinza Pharmacy',
                'pharmacy_code' => 'PHM-000006',
                'license_number' => 'TZ-PH-2026-0047',
                'pharmacy_type' => 'independent',
                'business_category' => 'Retail Pharmacy',
                'country' => 'Tanzania',
                'region' => 'Dar es Salaam',
                'district' => 'Kinondoni',
                'ward' => 'Sinza',
                'street' => 'Sinza Paluma Street',
                'latitude' => -6.7620,
                'longitude' => 39.2240,
                'phone' => '+255700000006',
                'email' => 'info@sinzapharmacy.com',
                'description' => 'Family-friendly pharmacy in Sinza offering fast service and competitive prices on everyday medications.',
                'working_days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                'working_hours' => ['open' => '08:00', 'close' => '20:00'],
                'opening_capital' => 40000.00,
                'monthly_revenue' => 10500.00,
                'status' => 'active',
                'is_published' => true,
                'license_expiry' => '2027-12-31',
                'subscription_expires_at' => now()->addYear(),
            ],
        ];

        foreach ($pharmacies as $data) {
            Pharmacy::create($data);
        }

        $ownerIds = [2, 13, 14, 15, 16, 17, 18, 19, 14, 15, 16, 17, 18, 19, 14, 15, 16, 17, 18, 19, 14, 15, 16, 17, 18, 19, 14, 15, 16, 17, 18];
        $names = [
            'Arusha Central Pharmacy', 'Mwanza Health Pharmacy', 'Dodoma Community Pharmacy',
            'Tanga Medical Centre', 'Mbeya Pharma Plus', 'Morogoro Health Pharmacy',
            'Iringa Medical Pharmacy', 'Kilimanjaro Pharma', 'Zanzibar Health Point',
            'Singida Community Pharmacy', 'Kagera Pharma Plus', 'Shinyanga Health Pharmacy',
            'Katavi Medical Pharmacy', 'Njombe Pharma Care', 'Ruvuma Health Pharmacy',
            'Lindi Medical Centre', 'Mtwara Pharma Plus', 'Songwe Health Pharmacy',
            'Geita Community Pharmacy', 'Simiyu Medical Pharmacy', 'Kigoma Pharma Care',
            'Tabora Health Pharmacy', 'Pwani Medical Centre', 'Manyara Pharma Plus',
            'Mara Health Pharmacy', 'Rukwa Pharma Care', 'Kaskazini A Unguja Pharmacy',
            'Kaskazini B Unguja Pharmacy', 'Kusini Unguja Pharmacy', 'Mjini Magharibi Pharmacy',
            'Kaskazini Pemba Pharmacy',
        ];
        $regions = ['Arusha','Mwanza','Dodoma','Tanga','Mbeya','Morogoro','Iringa','Kilimanjaro','Zanzibar','Singida','Kagera','Shinyanga','Katavi','Njombe','Ruvuma','Lindi','Mtwara','Songwe','Geita','Simiyu','Kigoma','Tabora','Pwani','Manyara','Mara','Rukwa','Kaskazini A Unguja','Kaskazini B Unguja','Kusini Unguja','Mjini Magharibi','Kaskazini Pemba'];
        $districts = ['Arusha DC','Mwanza MC','Dodoma MC','Tanga MC','Mbeya MC','Morogoro MC','Iringa MC','Moshi MC','Zanzibar City','Singida MC','Bukoba MC','Shinyanga MC','Tabora MC','Njombe MC','Songea MC','Lindi MC','Mtwara MC','Sumbawanga MC','Geita MC','Bariadi MC','Kigoma MC','Tabora MC','Bagamoyo DC','Babati DC','Musoma MC','Sumbawanga DC','Zanzibar City','Zanzibar City','Zanzibar City','Stone Town','Chake Chake'];
        $wards = ['Central','Town','Market','Hospital Road','Main Street','Beach Road','University Road','Industrial Area','Ward 1','Ward 2','Ward 3','Ward 4','Ward 5'];
        $faker = \Faker\Factory::create();

        for ($i = 0; $i < count($names); $i++) {
            $code = 'PHM-' . str_pad(7 + $i, 6, '0', STR_PAD_LEFT);
            Pharmacy::create([
                'owner_id' => $ownerIds[$i % count($ownerIds)],
                'pharmacy_name' => $names[$i],
                'pharmacy_code' => $code,
                'license_number' => 'TZ-PH-2026-' . str_pad(100 + $i, 5, '0', STR_PAD_LEFT),
                'pharmacy_type' => $faker->randomElement(['independent', 'chain', 'hospital']),
                'business_category' => $faker->randomElement(['Retail Pharmacy', 'Community Pharmacy', 'Medical Centre']),
                'country' => 'Tanzania',
                'region' => $regions[$i % count($regions)],
                'district' => $districts[$i % count($districts)],
                'ward' => $wards[$i % count($wards)],
                'street' => $faker->streetName,
                'latitude' => $faker->randomFloat(4, -11, -1),
                'longitude' => $faker->randomFloat(4, 29, 41),
                'phone' => '+255' . $faker->numerify('7## ### ###'),
                'email' => strtolower(str_replace(' ', '', $names[$i])) . '@pharmacy.com',
                'description' => 'Professional pharmacy serving the ' . $regions[$i % count($regions)] . ' community.',
                'working_days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                'working_hours' => ['open' => '08:00', 'close' => '20:00'],
                'opening_capital' => rand(30000, 100000),
                'monthly_revenue' => rand(8000, 25000),
                'status' => 'active',
                'is_published' => true,
                'license_expiry' => '2027-12-31',
                'subscription_expires_at' => now()->addYear(),
            ]);
        }

        $this->seedDrugsForNearbyPharmacies();
    }

    private function seedDrugsForNearbyPharmacies(): void
    {
        $drugSets = [
            2 => [
                ['name' => 'Amoxicillin 500mg', 'generic_name' => 'Amoxicillin', 'category_id' => 1, 'description' => 'Antibiotic for bacterial infections', 'manufacturer' => 'Generic Pharma Ltd', 'barcode' => 'PHX-002-AMX500', 'buying_price' => 5.00, 'selling_price' => 8.50, 'wholesale_price' => 7.00, 'quantity' => 120, 'unit' => 'capsules', 'reorder_level' => 20, 'expiry_date' => '2026-12-15', 'batch_number' => 'BATCH-KK-001', 'requires_prescription' => true],
                ['name' => 'Paracetamol 500mg', 'generic_name' => 'Acetaminophen', 'category_id' => 2, 'description' => 'Pain relief and fever reducer', 'manufacturer' => 'HealthCare Ltd', 'barcode' => 'PHX-002-PAR500', 'buying_price' => 1.50, 'selling_price' => 3.00, 'wholesale_price' => 2.25, 'quantity' => 250, 'unit' => 'tablets', 'reorder_level' => 40, 'expiry_date' => '2027-06-20', 'batch_number' => 'BATCH-KK-002', 'requires_prescription' => false],
                ['name' => 'Cetirizine 10mg', 'generic_name' => 'Cetirizine HCl', 'category_id' => 6, 'description' => 'Antihistamine for allergies', 'manufacturer' => 'AllergyFree Labs', 'barcode' => 'PHX-002-CET010', 'buying_price' => 2.00, 'selling_price' => 4.50, 'wholesale_price' => 3.25, 'quantity' => 150, 'unit' => 'tablets', 'reorder_level' => 25, 'expiry_date' => '2027-03-25', 'batch_number' => 'BATCH-KK-003', 'requires_prescription' => false],
                ['name' => 'Omeprazole 20mg', 'generic_name' => 'Omeprazole', 'category_id' => 8, 'description' => 'Proton pump inhibitor for acid reflux', 'manufacturer' => 'GastroHealth Inc', 'barcode' => 'PHX-002-OMP020', 'buying_price' => 3.50, 'selling_price' => 6.00, 'wholesale_price' => 4.75, 'quantity' => 100, 'unit' => 'capsules', 'reorder_level' => 15, 'expiry_date' => '2026-07-30', 'batch_number' => 'BATCH-KK-004', 'requires_prescription' => false],
                ['name' => 'Ibuprofen 400mg', 'generic_name' => 'Ibuprofen', 'category_id' => 2, 'description' => 'Anti-inflammatory painkiller', 'manufacturer' => 'PainAway Pharma', 'barcode' => 'PHX-002-IBU400', 'buying_price' => 2.50, 'selling_price' => 5.00, 'wholesale_price' => 3.75, 'quantity' => 180, 'unit' => 'tablets', 'reorder_level' => 30, 'expiry_date' => '2027-07-20', 'batch_number' => 'BATCH-KK-005', 'requires_prescription' => false],
                ['name' => 'Vitamin C 1000mg', 'generic_name' => 'Ascorbic Acid', 'category_id' => 5, 'description' => 'Vitamin C supplement for immunity', 'manufacturer' => 'NutriVita Ltd', 'barcode' => 'PHX-002-VTC1000', 'buying_price' => 3.00, 'selling_price' => 6.50, 'wholesale_price' => 4.75, 'quantity' => 200, 'unit' => 'tablets', 'reorder_level' => 25, 'expiry_date' => '2027-11-15', 'batch_number' => 'BATCH-KK-006', 'requires_prescription' => false],
            ],
            3 => [
                ['name' => 'Metformin 850mg', 'generic_name' => 'Metformin Hydrochloride', 'category_id' => 4, 'description' => 'First-line medication for type 2 diabetes', 'manufacturer' => 'DiabetCare Labs', 'barcode' => 'PHX-003-MET850', 'buying_price' => 4.00, 'selling_price' => 7.00, 'wholesale_price' => 5.50, 'quantity' => 200, 'unit' => 'tablets', 'reorder_level' => 30, 'expiry_date' => '2026-08-10', 'batch_number' => 'BATCH-MK-001', 'requires_prescription' => true],
                ['name' => 'Amlodipine 5mg', 'generic_name' => 'Amlodipine Besylate', 'category_id' => 3, 'description' => 'Calcium channel blocker for hypertension', 'manufacturer' => 'CardioVita Pharma', 'barcode' => 'PHX-003-AML005', 'buying_price' => 3.00, 'selling_price' => 5.50, 'wholesale_price' => 4.25, 'quantity' => 180, 'unit' => 'tablets', 'reorder_level' => 25, 'expiry_date' => '2027-09-01', 'batch_number' => 'BATCH-MK-002', 'requires_prescription' => true],
                ['name' => 'Losartan 50mg', 'generic_name' => 'Losartan Potassium', 'category_id' => 3, 'description' => 'Angiotensin receptor blocker for blood pressure', 'manufacturer' => 'CardioVita Pharma', 'barcode' => 'PHX-003-LOS050', 'buying_price' => 5.00, 'selling_price' => 9.00, 'wholesale_price' => 7.00, 'quantity' => 140, 'unit' => 'tablets', 'reorder_level' => 20, 'expiry_date' => '2027-05-30', 'batch_number' => 'BATCH-MK-003', 'requires_prescription' => true],
                ['name' => 'Atorvastatin 20mg', 'generic_name' => 'Atorvastatin Calcium', 'category_id' => 3, 'description' => 'Statin for cholesterol management', 'manufacturer' => 'HeartCare Labs', 'barcode' => 'PHX-003-ATV020', 'buying_price' => 6.00, 'selling_price' => 10.50, 'wholesale_price' => 8.25, 'quantity' => 90, 'unit' => 'tablets', 'reorder_level' => 15, 'expiry_date' => '2027-08-15', 'batch_number' => 'BATCH-MK-004', 'requires_prescription' => true],
                ['name' => 'Salbutamol Inhaler', 'generic_name' => 'Albuterol Sulfate', 'category_id' => 6, 'description' => 'Bronchodilator for asthma', 'manufacturer' => 'BreatheEasy Pharma', 'barcode' => 'PHX-003-SALINH', 'buying_price' => 12.00, 'selling_price' => 20.00, 'wholesale_price' => 16.00, 'quantity' => 10, 'unit' => 'vials', 'reorder_level' => 5, 'expiry_date' => '2027-08-20', 'batch_number' => 'BATCH-MK-005', 'requires_prescription' => true],
                ['name' => 'Paracetamol 500mg', 'generic_name' => 'Acetaminophen', 'category_id' => 2, 'description' => 'Pain relief and fever reducer', 'manufacturer' => 'HealthCare Ltd', 'barcode' => 'PHX-003-PAR500', 'buying_price' => 1.50, 'selling_price' => 3.00, 'wholesale_price' => 2.25, 'quantity' => 300, 'unit' => 'tablets', 'reorder_level' => 50, 'expiry_date' => '2027-06-20', 'batch_number' => 'BATCH-MK-006', 'requires_prescription' => false],
            ],
            4 => [
                ['name' => 'Azithromycin 250mg', 'generic_name' => 'Azithromycin', 'category_id' => 1, 'description' => 'Macrolide antibiotic for respiratory infections', 'manufacturer' => 'Generic Pharma Ltd', 'barcode' => 'PHX-004-AZI250', 'buying_price' => 8.00, 'selling_price' => 14.00, 'wholesale_price' => 11.00, 'quantity' => 80, 'unit' => 'tablets', 'reorder_level' => 15, 'expiry_date' => '2026-10-05', 'batch_number' => 'BATCH-OB-001', 'requires_prescription' => true],
                ['name' => 'Prednisolone 5mg', 'generic_name' => 'Prednisolone', 'category_id' => 6, 'description' => 'Corticosteroid for inflammation', 'manufacturer' => 'SteroidCare Pharma', 'barcode' => 'PHX-004-PRE005', 'buying_price' => 2.50, 'selling_price' => 4.50, 'wholesale_price' => 3.50, 'quantity' => 120, 'unit' => 'tablets', 'reorder_level' => 20, 'expiry_date' => '2027-01-15', 'batch_number' => 'BATCH-OB-002', 'requires_prescription' => true],
                ['name' => 'Metronidazole 400mg', 'generic_name' => 'Metronidazole', 'category_id' => 1, 'description' => 'Antibacterial for infections', 'manufacturer' => 'Generic Pharma Ltd', 'barcode' => 'PHX-004-MET400', 'buying_price' => 2.00, 'selling_price' => 4.00, 'wholesale_price' => 3.00, 'quantity' => 150, 'unit' => 'tablets', 'reorder_level' => 20, 'expiry_date' => '2026-11-10', 'batch_number' => 'BATCH-OB-003', 'requires_prescription' => true],
                ['name' => 'Hydrocortisone Cream', 'generic_name' => 'Hydrocortisone', 'category_id' => 7, 'description' => 'Topical corticosteroid for skin inflammation', 'manufacturer' => 'DermaCare Labs', 'barcode' => 'PHX-004-HYDCRM', 'buying_price' => 3.00, 'selling_price' => 5.50, 'wholesale_price' => 4.25, 'quantity' => 60, 'unit' => 'tubes', 'reorder_level' => 10, 'expiry_date' => '2027-04-10', 'batch_number' => 'BATCH-OB-004', 'requires_prescription' => false],
                ['name' => 'Iron Supplement', 'generic_name' => 'Ferrous Sulfate 200mg', 'category_id' => 5, 'description' => 'Iron supplement for anemia', 'manufacturer' => 'NutriVita Ltd', 'barcode' => 'PHX-004-IRN001', 'buying_price' => 2.50, 'selling_price' => 5.00, 'wholesale_price' => 3.75, 'quantity' => 160, 'unit' => 'tablets', 'reorder_level' => 25, 'expiry_date' => '2027-09-20', 'batch_number' => 'BATCH-OB-005', 'requires_prescription' => false],
                ['name' => 'Calcium + Vitamin D', 'generic_name' => 'Calcium Carbonate + Cholecalciferol', 'category_id' => 5, 'description' => 'Bone health supplement', 'manufacturer' => 'NutriVita Ltd', 'barcode' => 'PHX-004-CAD001', 'buying_price' => 4.00, 'selling_price' => 7.50, 'wholesale_price' => 5.75, 'quantity' => 180, 'unit' => 'tablets', 'reorder_level' => 25, 'expiry_date' => '2027-12-01', 'batch_number' => 'BATCH-OB-006', 'requires_prescription' => false],
            ],
            5 => [
                ['name' => 'Paracetamol 500mg', 'generic_name' => 'Acetaminophen', 'category_id' => 2, 'description' => 'Pain relief and fever reducer', 'manufacturer' => 'HealthCare Ltd', 'barcode' => 'PHX-005-PAR500', 'buying_price' => 1.50, 'selling_price' => 3.00, 'wholesale_price' => 2.25, 'quantity' => 200, 'unit' => 'tablets', 'reorder_level' => 40, 'expiry_date' => '2027-06-20', 'batch_number' => 'BATCH-TM-001', 'requires_prescription' => false],
                ['name' => 'Amoxicillin 250mg', 'generic_name' => 'Amoxicillin', 'category_id' => 1, 'description' => 'Antibiotic for common infections', 'manufacturer' => 'Generic Pharma Ltd', 'barcode' => 'PHX-005-AMX250', 'buying_price' => 3.50, 'selling_price' => 6.00, 'wholesale_price' => 4.75, 'quantity' => 130, 'unit' => 'capsules', 'reorder_level' => 20, 'expiry_date' => '2026-12-15', 'batch_number' => 'BATCH-TM-002', 'requires_prescription' => true],
                ['name' => 'Loratadine 10mg', 'generic_name' => 'Loratadine', 'category_id' => 6, 'description' => 'Non-drowsy antihistamine for allergies', 'manufacturer' => 'AllergyFree Labs', 'barcode' => 'PHX-005-LOR010', 'buying_price' => 2.50, 'selling_price' => 4.75, 'wholesale_price' => 3.50, 'quantity' => 140, 'unit' => 'tablets', 'reorder_level' => 20, 'expiry_date' => '2027-02-28', 'batch_number' => 'BATCH-TM-003', 'requires_prescription' => false],
                ['name' => 'Multivitamin Syrup', 'generic_name' => 'Multivitamin', 'category_id' => 5, 'description' => 'Complete multivitamin for children', 'manufacturer' => 'KidVita Pharma', 'barcode' => 'PHX-005-MVS001', 'buying_price' => 3.50, 'selling_price' => 6.50, 'wholesale_price' => 5.00, 'quantity' => 50, 'unit' => 'bottles', 'reorder_level' => 10, 'expiry_date' => '2026-09-15', 'batch_number' => 'BATCH-TM-004', 'requires_prescription' => false],
                ['name' => 'Benzoyl Peroxide 5%', 'generic_name' => 'Benzoyl Peroxide', 'category_id' => 7, 'description' => 'Topical treatment for acne', 'manufacturer' => 'DermaCare Labs', 'barcode' => 'PHX-005-BPO005', 'buying_price' => 4.50, 'selling_price' => 8.00, 'wholesale_price' => 6.25, 'quantity' => 40, 'unit' => 'tubes', 'reorder_level' => 8, 'expiry_date' => '2026-06-30', 'batch_number' => 'BATCH-TM-005', 'requires_prescription' => false],
                ['name' => 'Ibuprofen 400mg', 'generic_name' => 'Ibuprofen', 'category_id' => 2, 'description' => 'Anti-inflammatory painkiller', 'manufacturer' => 'PainAway Pharma', 'barcode' => 'PHX-005-IBU400', 'buying_price' => 2.50, 'selling_price' => 5.00, 'wholesale_price' => 3.75, 'quantity' => 160, 'unit' => 'tablets', 'reorder_level' => 30, 'expiry_date' => '2027-07-20', 'batch_number' => 'BATCH-TM-006', 'requires_prescription' => false],
            ],
            6 => [
                ['name' => 'Omeprazole 20mg', 'generic_name' => 'Omeprazole', 'category_id' => 8, 'description' => 'Proton pump inhibitor for acid reflux', 'manufacturer' => 'GastroHealth Inc', 'barcode' => 'PHX-006-OMP020', 'buying_price' => 3.50, 'selling_price' => 6.00, 'wholesale_price' => 4.75, 'quantity' => 110, 'unit' => 'capsules', 'reorder_level' => 15, 'expiry_date' => '2026-07-30', 'batch_number' => 'BATCH-SZ-001', 'requires_prescription' => false],
                ['name' => 'Amlodipine 5mg', 'generic_name' => 'Amlodipine Besylate', 'category_id' => 3, 'description' => 'Calcium channel blocker for hypertension', 'manufacturer' => 'CardioVita Pharma', 'barcode' => 'PHX-006-AML005', 'buying_price' => 3.00, 'selling_price' => 5.50, 'wholesale_price' => 4.25, 'quantity' => 170, 'unit' => 'tablets', 'reorder_level' => 25, 'expiry_date' => '2027-09-01', 'batch_number' => 'BATCH-SZ-002', 'requires_prescription' => true],
                ['name' => 'Paracetamol 500mg', 'generic_name' => 'Acetaminophen', 'category_id' => 2, 'description' => 'Pain relief and fever reducer', 'manufacturer' => 'HealthCare Ltd', 'barcode' => 'PHX-006-PAR500', 'buying_price' => 1.50, 'selling_price' => 3.00, 'wholesale_price' => 2.25, 'quantity' => 280, 'unit' => 'tablets', 'reorder_level' => 50, 'expiry_date' => '2027-06-20', 'batch_number' => 'BATCH-SZ-003', 'requires_prescription' => false],
                ['name' => 'Cetirizine 10mg', 'generic_name' => 'Cetirizine HCl', 'category_id' => 6, 'description' => 'Antihistamine for allergies', 'manufacturer' => 'AllergyFree Labs', 'barcode' => 'PHX-006-CET010', 'buying_price' => 2.00, 'selling_price' => 4.50, 'wholesale_price' => 3.25, 'quantity' => 140, 'unit' => 'tablets', 'reorder_level' => 20, 'expiry_date' => '2027-03-25', 'batch_number' => 'BATCH-SZ-004', 'requires_prescription' => false],
                ['name' => 'Vitamin C 1000mg', 'generic_name' => 'Ascorbic Acid', 'category_id' => 5, 'description' => 'Vitamin C supplement for immunity', 'manufacturer' => 'NutriVita Ltd', 'barcode' => 'PHX-006-VTC1000', 'buying_price' => 3.00, 'selling_price' => 6.50, 'wholesale_price' => 4.75, 'quantity' => 190, 'unit' => 'tablets', 'reorder_level' => 25, 'expiry_date' => '2027-11-15', 'batch_number' => 'BATCH-SZ-005', 'requires_prescription' => false],
                ['name' => 'Metformin 850mg', 'generic_name' => 'Metformin Hydrochloride', 'category_id' => 4, 'description' => 'First-line medication for type 2 diabetes', 'manufacturer' => 'DiabetCare Labs', 'barcode' => 'PHX-006-MET850', 'buying_price' => 4.00, 'selling_price' => 7.00, 'wholesale_price' => 5.50, 'quantity' => 95, 'unit' => 'tablets', 'reorder_level' => 20, 'expiry_date' => '2026-08-10', 'batch_number' => 'BATCH-SZ-006', 'requires_prescription' => true],
            ],
        ];

        foreach ($drugSets as $pharmacyId => $drugs) {
            foreach ($drugs as $drug) {
                Drug::create([
                    'pharmacy_id' => $pharmacyId,
                    'slug' => Str::slug($drug['name']),
                    'is_generic' => true,
                    'is_published' => true,
                    ...$drug,
                ]);
            }
        }
    }
}
