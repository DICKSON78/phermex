<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Drug;
use App\Models\DrugCategory;
use App\Models\DrugMovement;
use App\Models\Expense;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Pharmacist;
use App\Models\Pharmacy;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedUsers();
        $this->seedPharmacy();
        $this->seedPharmacist();
        $this->seedPharmacyUser();
        $this->seedCategories();
        $this->seedDrugs();
        $this->seedCustomers();
        $this->seedOrders();
        $this->seedPrescriptions();
        $this->seedExpenses();
        $this->seedStockMovements();
        $this->call([
            SubscriptionPlanSeeder::class,
            SubscriptionsSeeder::class,
            NearbyPharmaciesSeeder::class,
            HRSeeder::class,
            SupplyChainSeeder::class,
            AccountingSeeder::class,
            RegulatorySeeder::class,
            DeliveriesSeeder::class,
            AuditLogsSeeder::class,
            NotificationsSeeder::class,
            ChatSeeder::class,
            AdminModuleSeeder::class,
        ]);
    }

    private function seedUsers(): void
    {
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@pharmex.com',
            'phone' => '+255625460081',
            'role' => 'admin',
            'user_code' => 'PHX-ADMIN01',
            'is_active' => true,
            'is_verified' => true,
            'password' => Hash::make('password'),
        ]);

        User::create([
            'name' => 'John Mwalimu',
            'email' => 'owner@pharmex.com',
            'phone' => '+255700000001',
            'role' => 'owner',
            'user_code' => 'PHX-OWN0001',
            'is_active' => true,
            'is_verified' => true,
            'password' => Hash::make('password'),
        ]);

        User::create([
            'name' => 'Dr. Amina Juma',
            'email' => 'amina@pharmex.com',
            'phone' => '+255700000002',
            'role' => 'pharmacist',
            'user_code' => 'PHX-PHR001',
            'is_active' => true,
            'is_verified' => true,
            'password' => Hash::make('password'),
        ]);

        User::create([
            'name' => 'Test Customer',
            'email' => 'customer@pharmex.com',
            'phone' => '+255700000020',
            'role' => 'customer',
            'user_code' => 'CUS-TEST01',
            'is_active' => true,
            'is_verified' => true,
            'password' => Hash::make('password'),
        ]);
    }

    private function seedPharmacy(): void
    {
        Pharmacy::create([
            'owner_id' => 2,
            'pharmacy_name' => 'Mwalimu Pharmacy',
            'pharmacy_code' => 'PHM-000001',
            'license_number' => 'TZ-PH-2026-0042',
            'license_expiry' => '2027-12-31',
            'pharmacy_type' => 'independent',
            'business_category' => 'Retail Pharmacy',
            'country' => 'Tanzania',
            'region' => 'Dar es Salaam',
            'district' => 'Ilala',
            'ward' => 'Kariakoo',
            'street' => 'Morogoro Road',
            'latitude' => -6.7924,
            'longitude' => 39.2083,
            'description' => 'Mwalimu Pharmacy in the heart of Kariakoo, Dar es Salaam. Open 6 days a week for all your pharmaceutical needs.',
            'phone' => '+255700000001',
            'email' => 'info@mwalimupharmacy.com',
            'working_days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            'working_hours' => ['open' => '08:00', 'close' => '20:00'],
            'opening_capital' => 50000.00,
            'monthly_revenue' => 12500.00,
            'total_prescriptions' => 0,
            'total_customers' => 0,
            'status' => 'active',
            'is_published' => true,
            'subscription_expires_at' => now()->addYear(),
        ]);
    }

    private function seedPharmacyUser(): void
    {
        DB::table('pharmacy_user')->insert([
            ['pharmacy_id' => 1, 'user_id' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['pharmacy_id' => 1, 'user_id' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['pharmacy_id' => 1, 'user_id' => 4, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    private function seedPharmacist(): void
    {
        Pharmacist::create([
            'user_id' => 3,
            'pharmacy_id' => 1,
            'name' => 'Dr. Amina Juma',
            'phone' => '+255700000002',
            'license_number' => 'TZ-PH-LIC-2026-0198',
            'position' => 'pharmacist',
            'salary' => 850.00,
            'is_active' => true,
        ]);
    }

    private function seedCategories(): void
    {
        $categories = [
            ['name' => 'Antibiotics', 'description' => 'Medications used to treat bacterial infections'],
            ['name' => 'Pain Relief', 'description' => 'Analgesics and anti-inflammatory drugs'],
            ['name' => 'Cardiovascular', 'description' => 'Heart and blood circulation medications'],
            ['name' => 'Diabetes', 'description' => 'Medications for diabetes management'],
            ['name' => 'Vitamins & Supplements', 'description' => 'Nutritional supplements and vitamins'],
            ['name' => 'Respiratory', 'description' => 'Medications for respiratory conditions'],
            ['name' => 'Dermatology', 'description' => 'Skin care and dermatological treatments'],
            ['name' => 'Gastrointestinal', 'description' => 'Digestive system medications'],
        ];

        foreach ($categories as $category) {
            DrugCategory::create([
                'pharmacy_id' => 1,
                ...$category,
            ]);
        }
    }

    private function seedDrugs(): void
    {
        $drugs = [
            [
                'name' => 'Amoxicillin 500mg',
                'generic_name' => 'Amoxicillin',
                'category_id' => 1,
                'description' => 'Broad-spectrum antibiotic for bacterial infections',
                'manufacturer' => 'Generic Pharma Ltd',
                'barcode' => 'PHX-001-AMX500',
                'buying_price' => 5.00,
                'selling_price' => 8.50,
                'wholesale_price' => 7.00,
                'quantity' => 150,
                'unit' => 'capsules',
                'reorder_level' => 20,
                'expiry_date' => '2026-12-15',
                'batch_number' => 'BATCH-AMX-001',
                'requires_prescription' => true,
            ],
            [
                'name' => 'Paracetamol 500mg',
                'generic_name' => 'Acetaminophen',
                'category_id' => 2,
                'description' => 'Pain relief and fever reducer',
                'manufacturer' => 'HealthCare制药',
                'barcode' => 'PHX-002-PAR500',
                'buying_price' => 1.50,
                'selling_price' => 3.00,
                'wholesale_price' => 2.25,
                'quantity' => 300,
                'unit' => 'tablets',
                'reorder_level' => 50,
                'expiry_date' => '2027-06-20',
                'batch_number' => 'BATCH-PAR-002',
                'requires_prescription' => false,
            ],
            [
                'name' => 'Metformin 850mg',
                'generic_name' => 'Metformin Hydrochloride',
                'category_id' => 4,
                'description' => 'First-line medication for type 2 diabetes',
                'manufacturer' => 'DiabetCare Labs',
                'barcode' => 'PHX-003-MET850',
                'buying_price' => 4.00,
                'selling_price' => 7.00,
                'wholesale_price' => 5.50,
                'quantity' => 8,
                'unit' => 'tablets',
                'reorder_level' => 25,
                'expiry_date' => '2026-08-10',
                'batch_number' => 'BATCH-MET-003',
                'requires_prescription' => true,
            ],
            [
                'name' => 'Amlodipine 5mg',
                'generic_name' => 'Amlodipine Besylate',
                'category_id' => 3,
                'description' => 'Calcium channel blocker for hypertension',
                'manufacturer' => 'CardioVita Pharma',
                'barcode' => 'PHX-004-AML005',
                'buying_price' => 3.00,
                'selling_price' => 5.50,
                'wholesale_price' => 4.25,
                'quantity' => 200,
                'unit' => 'tablets',
                'reorder_level' => 30,
                'expiry_date' => '2027-09-01',
                'batch_number' => 'BATCH-AML-004',
                'requires_prescription' => true,
            ],
            [
                'name' => 'Omeprazole 20mg',
                'generic_name' => 'Omeprazole',
                'category_id' => 8,
                'description' => 'Proton pump inhibitor for acid reflux',
                'manufacturer' => 'GastroHealth Inc',
                'barcode' => 'PHX-005-OMP020',
                'buying_price' => 3.50,
                'selling_price' => 6.00,
                'wholesale_price' => 4.75,
                'quantity' => 120,
                'unit' => 'capsules',
                'reorder_level' => 20,
                'expiry_date' => '2026-07-30',
                'batch_number' => 'BATCH-OMP-005',
                'requires_prescription' => false,
            ],
            [
                'name' => 'Cetirizine 10mg',
                'generic_name' => 'Cetirizine HCl',
                'category_id' => 6,
                'description' => 'Antihistamine for allergies',
                'manufacturer' => 'AllergyFree Labs',
                'barcode' => 'PHX-006-CET010',
                'buying_price' => 2.00,
                'selling_price' => 4.50,
                'wholesale_price' => 3.25,
                'quantity' => 200,
                'unit' => 'tablets',
                'reorder_level' => 30,
                'expiry_date' => '2027-03-25',
                'batch_number' => 'BATCH-CET-006',
                'requires_prescription' => false,
            ],
            [
                'name' => 'Salbutamol Inhaler',
                'generic_name' => 'Albuterol Sulfate',
                'category_id' => 6,
                'description' => 'Bronchodilator for asthma and COPD',
                'manufacturer' => 'BreatheEasy Pharma',
                'barcode' => 'PHX-007-SALINH',
                'buying_price' => 12.00,
                'selling_price' => 20.00,
                'wholesale_price' => 16.00,
                'quantity' => 3,
                'unit' => 'vials',
                'reorder_level' => 8,
                'expiry_date' => '2027-08-20',
                'batch_number' => 'BATCH-SAL-007',
                'requires_prescription' => true,
            ],
            [
                'name' => 'Hydrocortisone Cream',
                'generic_name' => 'Hydrocortisone',
                'category_id' => 7,
                'description' => 'Topical corticosteroid for skin inflammation',
                'manufacturer' => 'DermaCare Labs',
                'barcode' => 'PHX-008-HYDCRM',
                'buying_price' => 3.00,
                'selling_price' => 5.50,
                'wholesale_price' => 4.25,
                'quantity' => 85,
                'unit' => 'tubes',
                'reorder_level' => 15,
                'expiry_date' => '2027-04-10',
                'batch_number' => 'BATCH-HYD-008',
                'requires_prescription' => false,
            ],
            [
                'name' => 'Vitamin C 1000mg',
                'generic_name' => 'Ascorbic Acid',
                'category_id' => 5,
                'description' => 'Vitamin C supplement for immune support',
                'manufacturer' => 'NutriVita Ltd',
                'barcode' => 'PHX-009-VTC1000',
                'buying_price' => 3.00,
                'selling_price' => 6.50,
                'wholesale_price' => 4.75,
                'quantity' => 250,
                'unit' => 'tablets',
                'reorder_level' => 30,
                'expiry_date' => '2027-11-15',
                'batch_number' => 'BATCH-VTC-009',
                'requires_prescription' => false,
            ],
            [
                'name' => 'Ibuprofen 400mg',
                'generic_name' => 'Ibuprofen',
                'category_id' => 2,
                'description' => 'Non-steroidal anti-inflammatory drug',
                'manufacturer' => 'PainAway Pharma',
                'barcode' => 'PHX-010-IBU400',
                'buying_price' => 2.50,
                'selling_price' => 5.00,
                'wholesale_price' => 3.75,
                'quantity' => 180,
                'unit' => 'tablets',
                'reorder_level' => 40,
                'expiry_date' => '2027-07-20',
                'batch_number' => 'BATCH-IBU-010',
                'requires_prescription' => false,
            ],
            [
                'name' => 'Azithromycin 250mg',
                'generic_name' => 'Azithromycin',
                'category_id' => 1,
                'description' => 'Macrolide antibiotic for respiratory infections',
                'manufacturer' => 'Generic Pharma Ltd',
                'barcode' => 'PHX-011-AZI250',
                'buying_price' => 8.00,
                'selling_price' => 14.00,
                'wholesale_price' => 11.00,
                'quantity' => 5,
                'unit' => 'tablets',
                'reorder_level' => 10,
                'expiry_date' => '2026-10-05',
                'batch_number' => 'BATCH-AZI-011',
                'requires_prescription' => true,
            ],
            [
                'name' => 'Losartan 50mg',
                'generic_name' => 'Losartan Potassium',
                'category_id' => 3,
                'description' => 'Angiotensin receptor blocker for hypertension',
                'manufacturer' => 'CardioVita Pharma',
                'barcode' => 'PHX-012-LOS050',
                'buying_price' => 5.00,
                'selling_price' => 9.00,
                'wholesale_price' => 7.00,
                'quantity' => 160,
                'unit' => 'tablets',
                'reorder_level' => 25,
                'expiry_date' => '2027-05-30',
                'batch_number' => 'BATCH-LOS-012',
                'requires_prescription' => true,
            ],
            [
                'name' => 'Atorvastatin 20mg',
                'generic_name' => 'Atorvastatin Calcium',
                'category_id' => 3,
                'description' => 'Statin for cholesterol management',
                'manufacturer' => 'HeartCare Labs',
                'barcode' => 'PHX-013-ATV020',
                'buying_price' => 6.00,
                'selling_price' => 10.50,
                'wholesale_price' => 8.25,
                'quantity' => 90,
                'unit' => 'tablets',
                'reorder_level' => 20,
                'expiry_date' => '2027-08-15',
                'batch_number' => 'BATCH-ATV-013',
                'requires_prescription' => true,
            ],
            [
                'name' => 'Loratadine 10mg',
                'generic_name' => 'Loratadine',
                'category_id' => 6,
                'description' => 'Non-drowsy antihistamine for allergies',
                'manufacturer' => 'AllergyFree Labs',
                'barcode' => 'PHX-014-LOR010',
                'buying_price' => 2.50,
                'selling_price' => 4.75,
                'wholesale_price' => 3.50,
                'quantity' => 180,
                'unit' => 'tablets',
                'reorder_level' => 25,
                'expiry_date' => '2027-02-28',
                'batch_number' => 'BATCH-LOR-014',
                'requires_prescription' => false,
            ],
            [
                'name' => 'Metronidazole 400mg',
                'generic_name' => 'Metronidazole',
                'category_id' => 1,
                'description' => 'Antiprotozoal and antibacterial agent',
                'manufacturer' => 'Generic Pharma Ltd',
                'barcode' => 'PHX-015-MET400',
                'buying_price' => 2.00,
                'selling_price' => 4.00,
                'wholesale_price' => 3.00,
                'quantity' => 140,
                'unit' => 'tablets',
                'reorder_level' => 20,
                'expiry_date' => '2026-11-10',
                'batch_number' => 'BATCH-MTN-015',
                'requires_prescription' => true,
            ],
            [
                'name' => 'Prednisolone 5mg',
                'generic_name' => 'Prednisolone',
                'category_id' => 6,
                'description' => 'Corticosteroid for inflammation and immune conditions',
                'manufacturer' => 'SteroidCare Pharma',
                'barcode' => 'PHX-016-PRE005',
                'buying_price' => 2.50,
                'selling_price' => 4.50,
                'wholesale_price' => 3.50,
                'quantity' => 100,
                'unit' => 'tablets',
                'reorder_level' => 15,
                'expiry_date' => '2027-01-15',
                'batch_number' => 'BATCH-PRE-016',
                'requires_prescription' => true,
            ],
            [
                'name' => 'Calcium + Vitamin D',
                'generic_name' => 'Calcium Carbonate + Cholecalciferol',
                'category_id' => 5,
                'description' => 'Bone health supplement',
                'manufacturer' => 'NutriVita Ltd',
                'barcode' => 'PHX-017-CAD001',
                'buying_price' => 4.00,
                'selling_price' => 7.50,
                'wholesale_price' => 5.75,
                'quantity' => 220,
                'unit' => 'tablets',
                'reorder_level' => 30,
                'expiry_date' => '2027-12-01',
                'batch_number' => 'BATCH-CAD-017',
                'requires_prescription' => false,
            ],
            [
                'name' => 'Iron Supplement',
                'generic_name' => 'Ferrous Sulfate 200mg',
                'category_id' => 5,
                'description' => 'Iron supplement for anemia',
                'manufacturer' => 'NutriVita Ltd',
                'barcode' => 'PHX-018-IRN001',
                'buying_price' => 2.50,
                'selling_price' => 5.00,
                'wholesale_price' => 3.75,
                'quantity' => 175,
                'unit' => 'tablets',
                'reorder_level' => 25,
                'expiry_date' => '2027-09-20',
                'batch_number' => 'BATCH-IRN-018',
                'requires_prescription' => false,
            ],
            [
                'name' => 'Multivitamin Syrup',
                'generic_name' => 'Multivitamin',
                'category_id' => 5,
                'description' => 'Complete multivitamin for children',
                'manufacturer' => 'KidVita Pharma',
                'barcode' => 'PHX-019-MVS001',
                'buying_price' => 3.50,
                'selling_price' => 6.50,
                'wholesale_price' => 5.00,
                'quantity' => 65,
                'unit' => 'bottles',
                'reorder_level' => 15,
                'expiry_date' => '2026-09-15',
                'batch_number' => 'BATCH-MVS-019',
                'requires_prescription' => false,
            ],
            [
                'name' => 'Benzoyl Peroxide 5%',
                'generic_name' => 'Benzoyl Peroxide',
                'category_id' => 7,
                'description' => 'Topical treatment for acne',
                'manufacturer' => 'DermaCare Labs',
                'barcode' => 'PHX-020-BPO005',
                'buying_price' => 4.50,
                'selling_price' => 8.00,
                'wholesale_price' => 6.25,
                'quantity' => 50,
                'unit' => 'tubes',
                'reorder_level' => 10,
                'expiry_date' => '2026-06-30',
                'batch_number' => 'BATCH-BPO-020',
                'requires_prescription' => false,
            ],
        ];

        foreach ($drugs as $drug) {
            Drug::create([
                'pharmacy_id' => 1,
                'slug' => Str::slug($drug['name']),
                'is_generic' => true,
                'is_published' => true,
                ...$drug,
            ]);
        }
    }

    private function seedCustomers(): void
    {
        $customers = [
            [
                'full_name' => 'Grace Hospital',
                'customer_code' => 'CUS-000001',
                'phone' => '+255700000010',
                'email' => 'grace@hospital.com',
                'gender' => 'other',
                'location' => 'Dar es Salaam',
                'street' => 'Sokoine Drive',
                'medical_conditions' => 'Regular bulk orders for hospital pharmacy',
            ],
            [
                'full_name' => 'Alice Mwamba',
                'customer_code' => 'CUS-000002',
                'phone' => '+255700000011',
                'email' => 'alice@email.com',
                'date_of_birth' => '1990-03-15',
                'gender' => 'female',
                'location' => 'Dar es Salaam',
                'street' => 'Mtaa wa Amani',
                'allergies' => 'Penicillin',
            ],
            [
                'full_name' => 'Bob Phiri',
                'customer_code' => 'CUS-000003',
                'phone' => '+255700000012',
                'email' => 'bob@email.com',
                'date_of_birth' => '1985-07-22',
                'gender' => 'male',
                'location' => 'Dar es Salaam',
                'street' => 'Bagamoyo Road',
                'medical_conditions' => 'Hypertension, Type 2 Diabetes',
            ],
            [
                'full_name' => 'City Clinic',
                'customer_code' => 'CUS-000004',
                'phone' => '+255700000013',
                'email' => 'clinic@city.com',
                'gender' => 'other',
                'location' => 'Dar es Salaam',
                'street' => 'Ohio Street',
                'medical_conditions' => 'Regular medical supply orders',
            ],
            [
                'full_name' => 'Carol Banda',
                'customer_code' => 'CUS-000005',
                'phone' => '+255700000014',
                'email' => 'carol@email.com',
                'date_of_birth' => '1992-11-08',
                'gender' => 'female',
                'location' => 'Dar es Salaam',
                'street' => 'Mikocheni',
            ],
        ];

        foreach ($customers as $customer) {
            Customer::create([
                'pharmacy_id' => 1,
                ...$customer,
            ]);
        }
    }

    private function seedOrders(): void
    {
        $orders = [
            [
                'order_code' => 'ORD-20260001',
                'customer_id' => 1,
                'subtotal' => 1250.00,
                'discount' => 0.00,
                'tax' => 225.00,
                'total' => 1475.00,
                'payment_method' => 'bank',
                'payment_status' => 'paid',
                'order_status' => 'dispensed',
                'processed_by' => 3,
                'items' => [
                    ['drug_id' => 1, 'quantity' => 100, 'unit_price' => 8.50],
                    ['drug_id' => 4, 'quantity' => 50, 'unit_price' => 5.50],
                ],
            ],
            [
                'order_code' => 'ORD-20260002',
                'customer_id' => 2,
                'subtotal' => 45.50,
                'discount' => 0.00,
                'tax' => 8.19,
                'total' => 53.69,
                'payment_method' => 'cash',
                'payment_status' => 'paid',
                'order_status' => 'dispensed',
                'processed_by' => 3,
                'items' => [
                    ['drug_id' => 2, 'quantity' => 10, 'unit_price' => 3.00],
                    ['drug_id' => 6, 'quantity' => 5, 'unit_price' => 4.50],
                ],
            ],
            [
                'order_code' => 'ORD-20260003',
                'customer_id' => 3,
                'subtotal' => 89.00,
                'discount' => 5.00,
                'tax' => 15.12,
                'total' => 99.12,
                'payment_method' => 'mobile',
                'payment_status' => 'paid',
                'order_status' => 'dispensed',
                'processed_by' => 3,
                'items' => [
                    ['drug_id' => 12, 'quantity' => 10, 'unit_price' => 9.00],
                ],
            ],
            [
                'order_code' => 'ORD-20260004',
                'customer_id' => 4,
                'subtotal' => 420.00,
                'discount' => 20.00,
                'tax' => 72.00,
                'total' => 472.00,
                'payment_method' => 'bank',
                'payment_status' => 'paid',
                'order_status' => 'dispensed',
                'processed_by' => 3,
                'items' => [
                    ['drug_id' => 5, 'quantity' => 30, 'unit_price' => 6.00],
                    ['drug_id' => 8, 'quantity' => 20, 'unit_price' => 5.50],
                    ['drug_id' => 9, 'quantity' => 10, 'unit_price' => 6.50],
                ],
            ],
            [
                'order_code' => 'ORD-20260005',
                'customer_id' => 5,
                'subtotal' => 32.50,
                'discount' => 0.00,
                'tax' => 5.85,
                'total' => 38.35,
                'payment_method' => 'cash',
                'payment_status' => 'paid',
                'order_status' => 'dispensed',
                'processed_by' => 3,
                'items' => [
                    ['drug_id' => 10, 'quantity' => 5, 'unit_price' => 5.00],
                    ['drug_id' => 14, 'quantity' => 2, 'unit_price' => 4.75],
                ],
            ],
            [
                'order_code' => 'ORD-20260006',
                'customer_id' => 2,
                'subtotal' => 67.00,
                'discount' => 0.00,
                'tax' => 12.06,
                'total' => 79.06,
                'payment_method' => 'mobile',
                'payment_status' => 'paid',
                'order_status' => 'dispensed',
                'processed_by' => 3,
                'items' => [
                    ['drug_id' => 11, 'quantity' => 3, 'unit_price' => 14.00],
                    ['drug_id' => 15, 'quantity' => 5, 'unit_price' => 4.00],
                ],
            ],
            [
                'order_code' => 'ORD-20260007',
                'customer_id' => 3,
                'subtotal' => 55.00,
                'discount' => 0.00,
                'tax' => 9.90,
                'total' => 64.90,
                'payment_method' => 'cash',
                'payment_status' => 'paid',
                'order_status' => 'dispensed',
                'processed_by' => 3,
                'items' => [
                    ['drug_id' => 13, 'quantity' => 5, 'unit_price' => 10.50],
                ],
            ],
            [
                'order_code' => 'ORD-20260008',
                'customer_id' => 1,
                'subtotal' => 780.00,
                'discount' => 30.00,
                'tax' => 135.00,
                'total' => 885.00,
                'payment_method' => 'bank',
                'payment_status' => 'paid',
                'order_status' => 'dispensed',
                'processed_by' => 3,
                'items' => [
                    ['drug_id' => 1, 'quantity' => 60, 'unit_price' => 8.50],
                    ['drug_id' => 3, 'quantity' => 30, 'unit_price' => 7.00],
                ],
            ],
            [
                'order_code' => 'ORD-20260009',
                'customer_id' => 4,
                'subtotal' => 310.00,
                'discount' => 10.00,
                'tax' => 54.00,
                'total' => 354.00,
                'payment_method' => 'bank',
                'payment_status' => 'paid',
                'order_status' => 'delivered',
                'processed_by' => 3,
                'items' => [
                    ['drug_id' => 17, 'quantity' => 20, 'unit_price' => 7.50],
                    ['drug_id' => 18, 'quantity' => 20, 'unit_price' => 5.00],
                    ['drug_id' => 19, 'quantity' => 10, 'unit_price' => 6.50],
                ],
            ],
            [
                'order_code' => 'ORD-20260010',
                'customer_id' => 5,
                'subtotal' => 24.00,
                'discount' => 0.00,
                'tax' => 4.32,
                'total' => 28.32,
                'payment_method' => 'cash',
                'payment_status' => 'paid',
                'order_status' => 'dispensed',
                'processed_by' => 3,
                'items' => [
                    ['drug_id' => 16, 'quantity' => 4, 'unit_price' => 4.50],
                    ['drug_id' => 20, 'quantity' => 1, 'unit_price' => 8.00],
                ],
            ],
        ];

        foreach ($orders as $orderData) {
            $items = $orderData['items'];
            unset($orderData['items']);

            $order = Order::create([
                'pharmacy_id' => 1,
                'order_type' => 'counter',
                'created_at' => now()->subDays(rand(0, 14)),
                ...$orderData,
            ]);

            foreach ($items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'total_price' => $item['quantity'] * $item['unit_price'],
                    ...$item,
                ]);
            }
        }
    }

    private function seedPrescriptions(): void
    {
        $prescriptions = [
            [
                'prescription_code' => 'RX-20260001',
                'customer_id' => 3,
                'doctor_name' => 'Dr. Mtembei',
                'hospital_name' => 'Muhimbili National Hospital',
                'diagnosis' => 'Hypertension management',
                'status' => 'dispensed',
                'dispensed_by' => 3,
                'dispensed_at' => now()->subDays(5),
                'items' => [
                    ['drug_id' => 4, 'quantity' => 30, 'dosage' => '5mg', 'frequency' => 'Once daily', 'duration' => '30 days'],
                    ['drug_id' => 12, 'quantity' => 30, 'dosage' => '50mg', 'frequency' => 'Once daily', 'duration' => '30 days'],
                ],
            ],
            [
                'prescription_code' => 'RX-20260002',
                'customer_id' => 2,
                'doctor_name' => 'Dr. Kimaro',
                'hospital_name' => 'Aga Khan Hospital',
                'diagnosis' => 'Allergic rhinitis',
                'status' => 'dispensed',
                'dispensed_by' => 3,
                'dispensed_at' => now()->subDays(3),
                'items' => [
                    ['drug_id' => 6, 'quantity' => 20, 'dosage' => '10mg', 'frequency' => 'Once daily', 'duration' => '20 days'],
                    ['drug_id' => 14, 'quantity' => 20, 'dosage' => '10mg', 'frequency' => 'Once daily', 'duration' => '20 days'],
                ],
            ],
            [
                'prescription_code' => 'RX-20260003',
                'customer_id' => 3,
                'doctor_name' => 'Dr. Mtembei',
                'hospital_name' => 'Muhimbili National Hospital',
                'diagnosis' => 'Type 2 Diabetes management',
                'status' => 'dispensed',
                'dispensed_by' => 3,
                'dispensed_at' => now()->subDays(7),
                'items' => [
                    ['drug_id' => 3, 'quantity' => 60, 'dosage' => '850mg', 'frequency' => 'Twice daily', 'duration' => '30 days'],
                ],
            ],
            [
                'prescription_code' => 'RX-20260004',
                'customer_id' => 5,
                'doctor_name' => 'Dr. Salim',
                'hospital_name' => 'Ilala District Hospital',
                'diagnosis' => 'Bacterial skin infection',
                'status' => 'pending',
                'items' => [
                    ['drug_id' => 1, 'quantity' => 21, 'dosage' => '500mg', 'frequency' => 'Three times daily', 'duration' => '7 days'],
                    ['drug_id' => 20, 'quantity' => 1, 'dosage' => '5%', 'frequency' => 'Apply twice daily', 'duration' => '14 days'],
                ],
            ],
            [
                'prescription_code' => 'RX-20260005',
                'customer_id' => 2,
                'doctor_name' => 'Dr. Kimaro',
                'hospital_name' => 'Aga Khan Hospital',
                'diagnosis' => 'Gastric acid reflux',
                'status' => 'pending',
                'items' => [
                    ['drug_id' => 5, 'quantity' => 28, 'dosage' => '20mg', 'frequency' => 'Once daily before breakfast', 'duration' => '28 days'],
                ],
            ],
        ];

        foreach ($prescriptions as $prescriptionData) {
            $items = $prescriptionData['items'];
            unset($prescriptionData['items']);

            $prescription = Prescription::create([
                'pharmacy_id' => 1,
                'created_at' => now()->subDays(rand(1, 10)),
                ...$prescriptionData,
            ]);

            foreach ($items as $item) {
                PrescriptionItem::create([
                    'prescription_id' => $prescription->id,
                    'is_dispensed' => $prescriptionData['status'] === 'dispensed',
                    ...$item,
                ]);
            }
        }
    }

    private function seedExpenses(): void
    {
        $expenses = [
            [
                'category' => 'Rent',
                'description' => 'Monthly shop rent - July 2026',
                'amount' => 850.00,
                'date' => '2026-07-01',
                'receipt_number' => 'RCT-RENT-0726',
            ],
            [
                'category' => 'Utilities',
                'description' => 'Electricity bill - TANESCO',
                'amount' => 120.00,
                'date' => '2026-07-05',
                'receipt_number' => 'RCT-ELEC-0726',
            ],
            [
                'category' => 'Supplies',
                'description' => 'Packaging materials and labels',
                'amount' => 45.00,
                'date' => '2026-07-10',
                'receipt_number' => 'RCT-SUP-0726',
            ],
            [
                'category' => 'Utilities',
                'description' => 'Internet service - Vodacom',
                'amount' => 65.00,
                'date' => '2026-07-12',
                'receipt_number' => 'RCT-INT-0726',
            ],
            [
                'category' => 'Maintenance',
                'description' => 'Air conditioning servicing',
                'amount' => 80.00,
                'date' => '2026-07-15',
                'receipt_number' => 'RCT-MNT-0726',
            ],
        ];

        foreach ($expenses as $expense) {
            Expense::create([
                'pharmacy_id' => 1,
                'recorded_by' => 2,
                ...$expense,
            ]);
        }
    }

    private function seedStockMovements(): void
    {
        $movements = [
            [
                'drug_id' => 1,
                'movement_type' => 'purchase',
                'quantity' => 200,
                'unit_cost' => 5.00,
                'reference_number' => 'PO-001',
                'notes' => 'Initial stock purchase from Generic Pharma Ltd',
            ],
            [
                'drug_id' => 1,
                'movement_type' => 'sale',
                'quantity' => -50,
                'unit_cost' => 8.50,
                'reference_number' => 'ORD-20260001',
                'notes' => 'Sale to Grace Hospital',
            ],
            [
                'drug_id' => 2,
                'movement_type' => 'purchase',
                'quantity' => 500,
                'unit_cost' => 1.50,
                'reference_number' => 'PO-002',
                'notes' => 'Bulk purchase from HealthCare',
            ],
            [
                'drug_id' => 2,
                'movement_type' => 'sale',
                'quantity' => -200,
                'unit_cost' => 3.00,
                'reference_number' => 'ORD-20260002',
                'notes' => 'Various counter sales',
            ],
            [
                'drug_id' => 3,
                'movement_type' => 'adjustment',
                'quantity' => -5,
                'unit_cost' => 4.00,
                'reference_number' => null,
                'notes' => 'Damaged stock adjustment',
            ],
            [
                'drug_id' => 7,
                'movement_type' => 'sale',
                'quantity' => -5,
                'unit_cost' => 20.00,
                'reference_number' => 'ORD-20260003',
                'notes' => 'Inhaler sales',
            ],
            [
                'drug_id' => 9,
                'movement_type' => 'purchase',
                'quantity' => 100,
                'unit_cost' => 3.00,
                'reference_number' => 'PO-003',
                'notes' => 'Restock from NutriVita',
            ],
            [
                'drug_id' => 11,
                'movement_type' => 'expiry',
                'quantity' => -10,
                'unit_cost' => 8.00,
                'reference_number' => 'EXP-001',
                'notes' => 'Expired batch removed from inventory',
            ],
        ];

        foreach ($movements as $movement) {
            DrugMovement::create([
                'pharmacy_id' => 1,
                'performed_by' => 3,
                'created_at' => now()->subDays(rand(0, 14)),
                ...$movement,
            ]);
        }
    }
}
