<?php

namespace Database\Seeders;

use App\Models\WholesaleInventory;
use App\Models\Wholesaler;
use Illuminate\Database\Seeder;

/**
 * Demo suppliers and catalogue for the wholesale marketplace.
 *
 * The marketplace is only useful once a pharmacy can see who supplies what, so
 * this seeds a small but realistic network: two wholesalers and two
 * distributors, each with medicines sold by piece/pack, box and carton.
 */
class WholesaleMarketplaceSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            [
                'wholesaler_id' => 'WHOLE-TW001',
                'name' => 'Tanzania Wholesale Pharmacy Ltd',
                'business_type' => 'wholesaler',
                'email' => 'orders@twpharmacy.co.tz',
                'phone' => '+255 22 212 3400',
                'address' => 'Plot 45, Nyerere Road, Ilala',
                'city' => 'Dar es Salaam',
                'region' => 'Dar es Salaam',
                'license_number' => 'TZ-WHL-00123',
                'registration_number' => 'BRELA-110234',
                'tax_id' => 'TIN-100-234-567',
                'bank_name' => 'CRDB Bank',
                'bank_account' => '0150-1234-5678-00',
                'contact_person' => 'Asha Mwinyi',
                'contact_phone' => '+255 754 111 222',
                'delivery_fee' => 5,
                'express_delivery_fee' => 10,
                'minimum_order_amount' => 50,
                'payment_terms_days' => 30,
                'accepts_credit' => true,
                'rating' => 4.8,
                'on_time_delivery_rate' => 96,
                'products' => ['paracetamol', 'amoxicillin', 'omeprazole', 'ors', 'vitamin-c'],
            ],
            [
                'wholesaler_id' => 'WHOLE-KMD002',
                'name' => 'Kariakoo Medical Distributors',
                'business_type' => 'distributor',
                'email' => 'supply@kariakoomed.co.tz',
                'phone' => '+255 22 218 7700',
                'address' => 'Msimbazi Street, Kariakoo',
                'city' => 'Dar es Salaam',
                'region' => 'Dar es Salaam',
                'license_number' => 'TZ-DST-00456',
                'registration_number' => 'BRELA-220891',
                'tax_id' => 'TIN-100-778-112',
                'bank_name' => 'NMB Bank',
                'bank_account' => '2020-4455-6677-88',
                'contact_person' => 'Joseph Magesa',
                'contact_phone' => '+255 713 444 555',
                'delivery_fee' => 4,
                'express_delivery_fee' => 9,
                'minimum_order_amount' => 30,
                'payment_terms_days' => 15,
                'accepts_credit' => true,
                'rating' => 4.6,
                'on_time_delivery_rate' => 92,
                'products' => ['paracetamol', 'ibuprofen', 'cetirizine', 'metformin', 'multivitamin'],
            ],
            [
                'wholesaler_id' => 'WHOLE-CPS003',
                'name' => 'Coastline Pharma Supplies',
                'business_type' => 'wholesaler',
                'email' => 'sales@coastlinepharma.co.tz',
                'phone' => '+255 22 276 4433',
                'address' => 'Nelson Mandela Road, Mikocheni',
                'city' => 'Dar es Salaam',
                'region' => 'Dar es Salaam',
                'license_number' => 'TZ-WHL-00789',
                'registration_number' => 'BRELA-330512',
                'tax_id' => 'TIN-100-991-334',
                'bank_name' => 'Stanbic Bank',
                'bank_account' => '1100-9988-7766-55',
                'contact_person' => 'Neema Mushi',
                'contact_phone' => '+255 762 333 444',
                'delivery_fee' => 6,
                'express_delivery_fee' => 12,
                'minimum_order_amount' => 75,
                'payment_terms_days' => 30,
                'accepts_credit' => true,
                'rating' => 4.4,
                'on_time_delivery_rate' => 89,
                'products' => ['amoxicillin', 'loratadine', 'benzoyl', 'artemether', 'omeprazole'],
            ],
            [
                'wholesaler_id' => 'WHOLE-HHD004',
                'name' => 'Highland Health Distributors',
                'business_type' => 'distributor',
                'email' => 'orders@highlandhealth.co.tz',
                'phone' => '+255 26 232 1100',
                'address' => 'Kaloleni Road, Arusha',
                'city' => 'Arusha',
                'region' => 'Arusha',
                'license_number' => 'TZ-DST-00321',
                'registration_number' => 'BRELA-440673',
                'tax_id' => 'TIN-200-112-889',
                'bank_name' => 'Equity Bank',
                'bank_account' => '3300-1122-3344-66',
                'contact_person' => 'Daniel Mollel',
                'contact_phone' => '+255 784 222 111',
                'delivery_fee' => 8,
                'express_delivery_fee' => 15,
                'minimum_order_amount' => 100,
                'payment_terms_days' => 45,
                'accepts_credit' => false,
                'rating' => 4.2,
                'on_time_delivery_rate' => 85,
                'products' => ['paracetamol', 'multivitamin', 'vitamin-c', 'cetirizine', 'ibuprofen'],
            ],
        ];

        $catalogue = $this->catalogue();

        foreach ($suppliers as $supplier) {
            $products = $supplier['products'];
            unset($supplier['products']);

            $wholesaler = Wholesaler::updateOrCreate(
                ['wholesaler_id' => $supplier['wholesaler_id']],
                $supplier + ['country' => 'Tanzania', 'status' => 'active']
            );

            foreach ($products as $key) {
                foreach ($catalogue[$key] as $variant) {
                    WholesaleInventory::updateOrCreate(
                        [
                            'wholesaler_id' => $wholesaler->wholesaler_id,
                            'drug_id' => $variant['drug_id'],
                            'batch_number' => $variant['batch_number'],
                        ],
                        $variant + [
                            'wholesaler_id' => $wholesaler->wholesaler_id,
                            'minimum_stock_level' => 20,
                            'reorder_quantity' => 50,
                            'manufacture_date' => now()->subMonths(3)->toDateString(),
                            'expiry_date' => now()->addMonths(18)->toDateString(),
                            'location' => 'Warehouse A',
                            'status' => 'available',
                        ]
                    );
                }
            }
        }
    }

    private function catalogue(): array
    {
        return [
            'paracetamol' => $this->variants('Paracetamol 500mg', 'PARA-500', 'Pain & Fever', 2.50, 18.00, 160.00),
            'amoxicillin' => $this->variants('Amoxicillin 250mg', 'AMOX-250', 'Antibiotics', 5.00, 42.00, 380.00),
            'loratadine' => $this->variants('Loratadine 10mg', 'LORA-10', 'Allergy', 3.50, 30.00, null),
            'multivitamin' => $this->variants('Multivitamin Syrup', 'MULTI-SYR', 'Vitamins', 6.50, 68.00, null, 'bottle'),
            'benzoyl' => $this->variants('Benzoyl Peroxide 5%', 'BENZ-5', 'Dermatology', 4.00, 42.00, null, 'tube'),
            'ibuprofen' => $this->variants('Ibuprofen 400mg', 'IBU-400', 'Pain & Fever', 3.20, 26.00, 220.00),
            'metformin' => $this->variants('Metformin 500mg', 'MET-500', 'Diabetes', 4.20, 35.00, 300.00),
            'omeprazole' => $this->variants('Omeprazole 20mg', 'OME-20', 'Gastro', 6.00, 50.00, 430.00),
            'ors' => $this->variants('ORS Sachets', 'ORS-SACH', 'Hydration', 1.80, 15.00, 120.00, 'sachet', false),
            'artemether' => $this->variants('Artemether-Lumefantrine', 'ART-LUM', 'Antimalarial', 8.50, 72.00, 640.00),
            'cetirizine' => $this->variants('Cetirizine 10mg', 'CET-10', 'Allergy', 2.80, 24.00, 200.00),
            'vitamin-c' => $this->variants('Vitamin C 500mg', 'VITC-500', 'Vitamins', 2.20, 18.00, 150.00),
        ];
    }

    private function variants(string $name, string $code, string $category, float $pack, float $box, ?float $carton, string $pieceLabel = 'pack', bool $withPiece = true): array
    {
        $variants = [];

        if ($withPiece) {
            $variants[] = [
                'drug_id' => $code.'-PIECE',
                'drug_name' => $name,
                'unit' => 'piece',
                'pack_size' => 1,
                'category' => $category,
                'batch_number' => $code.'-PCS',
                'quantity_in_stock' => 500,
                'unit_price' => round($pack / 10, 2),
            ];
        }

        $variants[] = [
            'drug_id' => $code.'-PACK',
            'drug_name' => $name,
            'unit' => $pieceLabel === 'pack' ? 'pack (10)' : $pieceLabel,
            'pack_size' => 10,
            'category' => $category,
            'batch_number' => $code.'-PK',
            'quantity_in_stock' => 180,
            'unit_price' => $pack,
        ];

        $variants[] = [
            'drug_id' => $code.'-BOX',
            'drug_name' => $name,
            'unit' => 'box (100)',
            'pack_size' => 100,
            'category' => $category,
            'batch_number' => $code.'-BX',
            'quantity_in_stock' => 60,
            'unit_price' => $box,
        ];

        if ($carton !== null) {
            $variants[] = [
                'drug_id' => $code.'-CARTON',
                'drug_name' => $name,
                'unit' => 'carton (1000)',
                'pack_size' => 1000,
                'category' => $category,
                'batch_number' => $code.'-CT',
                'quantity_in_stock' => 25,
                'unit_price' => $carton,
            ];
        }

        return $variants;
    }
}
