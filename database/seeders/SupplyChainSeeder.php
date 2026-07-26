<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupplyChainSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $suppliers = $this->seedSuppliers();
        $poIds = $this->seedPurchaseOrders($suppliers);
        $this->seedPurchaseOrderItems($poIds);
        $this->seedGoodsReceived($poIds, $suppliers);
        $this->seedStockTransfers();
        $this->seedStockReturns($suppliers);
        $this->seedDamagedGoods();
        $this->seedControlledSubstances();
        $this->seedDrugRecalls();

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    private function seedSuppliers(): array
    {
        $now = now();

        $data = [
            [
                'pharmacy_id' => 1,
                'name' => 'Generic Pharma Ltd',
                'contact_person' => 'Hamisi Mwakasege',
                'email' => 'orders@genericpharma.co.tz',
                'phone' => '+255222110045',
                'address' => 'Block B, Plot 45, Temeke Industrial Area',
                'city' => 'Dar es Salaam',
                'country' => 'Tanzania',
                'tax_id' => 'TIN-102-345-678',
                'payment_terms' => 'net_30',
                'rating' => 4.50,
                'total_orders' => 12,
                'total_purchased' => 850000.00,
                'is_active' => true,
                'notes' => 'Primary supplier for generic antibiotics and pain relief medications',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'name' => 'HealthCare Tanzania',
                'contact_person' => 'Rebecca Nkwabi',
                'email' => 'supply@healthcaretz.co.tz',
                'phone' => '+255272530012',
                'address' => 'Sakina Road, Near Arusha Clock Tower',
                'city' => 'Arusha',
                'country' => 'Tanzania',
                'tax_id' => 'TIN-203-456-789',
                'payment_terms' => 'net_30',
                'rating' => 4.20,
                'total_orders' => 8,
                'total_purchased' => 620000.00,
                'is_active' => true,
                'notes' => 'Specialist in chronic disease medications and cardiovascular drugs',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'name' => 'NutriVita Ltd',
                'contact_person' => 'Juma Mwamba',
                'email' => 'orders@nutrivita.co.tz',
                'phone' => '+255282620078',
                'address' => 'Plot 18, Mwanza Industrial Area',
                'city' => 'Mwanza',
                'country' => 'Tanzania',
                'tax_id' => 'TIN-304-567-890',
                'payment_terms' => 'net_15',
                'rating' => 4.70,
                'total_orders' => 6,
                'total_purchased' => 340000.00,
                'is_active' => true,
                'notes' => 'Reliable supplier for vitamins, supplements and nutritional products',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'name' => 'CardioVita Pharma',
                'contact_person' => 'Dr. Emmanuel Mkwizu',
                'email' => 'procurement@cardiovita.co.tz',
                'phone' => '+255222800199',
                'address' => 'Shaaban Robert Street, Plot 78',
                'city' => 'Dar es Salaam',
                'country' => 'Tanzania',
                'tax_id' => 'TIN-405-678-901',
                'payment_terms' => 'net_30',
                'rating' => 4.40,
                'total_orders' => 5,
                'total_purchased' => 520000.00,
                'is_active' => true,
                'notes' => 'Premium cardiovascular and hypertension medications',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'name' => 'DermaCare Labs',
                'contact_person' => 'Sarah Wanjiku',
                'email' => 'sales@dermacare.co.ke',
                'phone' => '+254202400123',
                'address' => 'Westlands Business Park, Unit 14',
                'city' => 'Nairobi',
                'country' => 'Kenya',
                'tax_id' => 'KEN-TIN-789012',
                'payment_terms' => 'net_60',
                'rating' => 4.60,
                'total_orders' => 3,
                'total_purchased' => 280000.00,
                'is_active' => true,
                'notes' => 'International supplier for dermatology and skincare pharmaceutical products',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('suppliers')->insert($data);

        return DB::table('suppliers')->where('pharmacy_id', 1)->pluck('id', 'name')->toArray();
    }

    private function seedPurchaseOrders(array $suppliers): array
    {
        $now = now();

        $orders = [
            [
                'pharmacy_id' => 1,
                'supplier_id' => $suppliers['Generic Pharma Ltd'],
                'order_number' => 'PO-2026-0001',
                'order_date' => '2026-01-15',
                'expected_delivery_date' => '2026-01-25',
                'status' => 'received',
                'subtotal' => 1250.00,
                'tax_amount' => 225.00,
                'discount_amount' => 0.00,
                'total' => 1475.00,
                'payment_status' => 'paid',
                'amount_paid' => 1475.00,
                'notes' => 'Quarterly restock of antibiotics',
                'approved_by' => 2,
                'approved_at' => '2026-01-16 09:30:00',
                'received_by' => 3,
                'received_at' => '2026-01-24 14:00:00',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'supplier_id' => $suppliers['CardioVita Pharma'],
                'order_number' => 'PO-2026-0002',
                'order_date' => '2026-02-10',
                'expected_delivery_date' => '2026-02-20',
                'status' => 'received',
                'subtotal' => 890.00,
                'tax_amount' => 160.20,
                'discount_amount' => 40.00,
                'total' => 1010.20,
                'payment_status' => 'paid',
                'amount_paid' => 1010.20,
                'notes' => 'Cardiovascular drugs restocking',
                'approved_by' => 2,
                'approved_at' => '2026-02-11 10:00:00',
                'received_by' => 3,
                'received_at' => '2026-02-18 11:30:00',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'supplier_id' => $suppliers['NutriVita Ltd'],
                'order_number' => 'PO-2026-0003',
                'order_date' => '2026-07-20',
                'expected_delivery_date' => '2026-07-30',
                'status' => 'pending_approval',
                'subtotal' => 675.00,
                'tax_amount' => 121.50,
                'discount_amount' => 0.00,
                'total' => 796.50,
                'payment_status' => 'unpaid',
                'amount_paid' => 0.00,
                'notes' => 'Urgent vitamin and supplement restock before rainy season',
                'approved_by' => null,
                'approved_at' => null,
                'received_by' => null,
                'received_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'supplier_id' => $suppliers['HealthCare Tanzania'],
                'order_number' => 'PO-2026-0004',
                'order_date' => '2026-06-05',
                'expected_delivery_date' => '2026-06-18',
                'status' => 'partially_received',
                'subtotal' => 1420.00,
                'tax_amount' => 255.60,
                'discount_amount' => 70.00,
                'total' => 1605.60,
                'payment_status' => 'partial',
                'amount_paid' => 800.00,
                'notes' => 'Partially delivered due to supply chain delay from Arusha warehouse',
                'approved_by' => 2,
                'approved_at' => '2026-06-06 08:45:00',
                'received_by' => 3,
                'received_at' => '2026-06-16 10:00:00',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('purchase_orders')->insert($orders);

        $poIds = [];
        foreach ($orders as $order) {
            $poIds[$order['order_number']] = DB::table('purchase_orders')
                ->where('order_number', $order['order_number'])
                ->value('id');
        }

        return $poIds;
    }

    private function seedPurchaseOrderItems(array $poIds): void
    {
        $now = now();

        $items = [
            [
                'purchase_order_id' => $poIds['PO-2026-0001'],
                'drug_id' => 1,
                'quantity_ordered' => 200,
                'quantity_received' => 200,
                'unit_cost' => 5.00,
                'total_cost' => 1000.00,
                'batch_number' => 'BATCH-AMX-2601',
                'expiry_date' => '2027-06-30',
                'notes' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'purchase_order_id' => $poIds['PO-2026-0001'],
                'drug_id' => 11,
                'quantity_ordered' => 50,
                'quantity_received' => 50,
                'unit_cost' => 8.00,
                'total_cost' => 400.00,
                'batch_number' => 'BATCH-AZI-2601',
                'expiry_date' => '2027-09-15',
                'notes' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'purchase_order_id' => $poIds['PO-2026-0001'],
                'drug_id' => 15,
                'quantity_ordered' => 50,
                'quantity_received' => 50,
                'unit_cost' => 2.00,
                'total_cost' => 100.00,
                'batch_number' => 'BATCH-MTN-2601',
                'expiry_date' => '2027-05-20',
                'notes' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // PO-2026-0002 items (CardioVita - cardiovascular)
            [
                'purchase_order_id' => $poIds['PO-2026-0002'],
                'drug_id' => 4,
                'quantity_ordered' => 100,
                'quantity_received' => 100,
                'unit_cost' => 3.00,
                'total_cost' => 300.00,
                'batch_number' => 'BATCH-AML-2602',
                'expiry_date' => '2027-12-01',
                'notes' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'purchase_order_id' => $poIds['PO-2026-0002'],
                'drug_id' => 12,
                'quantity_ordered' => 80,
                'quantity_received' => 80,
                'unit_cost' => 5.00,
                'total_cost' => 400.00,
                'batch_number' => 'BATCH-LOS-2602',
                'expiry_date' => '2027-10-15',
                'notes' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'purchase_order_id' => $poIds['PO-2026-0002'],
                'drug_id' => 13,
                'quantity_ordered' => 30,
                'quantity_received' => 30,
                'unit_cost' => 6.00,
                'total_cost' => 180.00,
                'batch_number' => 'BATCH-ATV-2602',
                'expiry_date' => '2027-11-20',
                'notes' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // PO-2026-0003 items (NutriVita - vitamins, pending)
            [
                'purchase_order_id' => $poIds['PO-2026-0003'],
                'drug_id' => 9,
                'quantity_ordered' => 100,
                'quantity_received' => 0,
                'unit_cost' => 3.00,
                'total_cost' => 300.00,
                'batch_number' => null,
                'expiry_date' => '2027-10-01',
                'notes' => 'Awaiting delivery',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'purchase_order_id' => $poIds['PO-2026-0003'],
                'drug_id' => 17,
                'quantity_ordered' => 60,
                'quantity_received' => 0,
                'unit_cost' => 4.00,
                'total_cost' => 240.00,
                'batch_number' => null,
                'expiry_date' => '2027-11-15',
                'notes' => 'Awaiting delivery',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'purchase_order_id' => $poIds['PO-2026-0003'],
                'drug_id' => 19,
                'quantity_ordered' => 25,
                'quantity_received' => 0,
                'unit_cost' => 3.50,
                'total_cost' => 87.50,
                'batch_number' => null,
                'expiry_date' => '2027-08-10',
                'notes' => 'Awaiting delivery',
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // PO-2026-0004 items (HealthCare TZ - partially received)
            [
                'purchase_order_id' => $poIds['PO-2026-0004'],
                'drug_id' => 3,
                'quantity_ordered' => 100,
                'quantity_received' => 100,
                'unit_cost' => 4.00,
                'total_cost' => 400.00,
                'batch_number' => 'BATCH-MET-2606',
                'expiry_date' => '2027-09-30',
                'notes' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'purchase_order_id' => $poIds['PO-2026-0004'],
                'drug_id' => 5,
                'quantity_ordered' => 80,
                'quantity_received' => 80,
                'unit_cost' => 3.50,
                'total_cost' => 280.00,
                'batch_number' => 'BATCH-OMP-2606',
                'expiry_date' => '2027-08-01',
                'notes' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'purchase_order_id' => $poIds['PO-2026-0004'],
                'drug_id' => 16,
                'quantity_ordered' => 50,
                'quantity_received' => 0,
                'unit_cost' => 2.50,
                'total_cost' => 125.00,
                'batch_number' => null,
                'expiry_date' => '2027-07-15',
                'notes' => 'Delayed - expected in next shipment',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('purchase_order_items')->insert($items);
    }

    private function seedGoodsReceived(array $poIds, array $suppliers): void
    {
        $now = now();

        $records = [
            [
                'pharmacy_id' => 1,
                'purchase_order_id' => $poIds['PO-2026-0001'],
                'grn_number' => 'GRN-2026-0001',
                'received_date' => '2026-01-24',
                'received_by' => 3,
                'supplier_id' => $suppliers['Generic Pharma Ltd'],
                'total_items' => 300,
                'total_value' => 1475.00,
                'status' => 'complete',
                'quality_check' => 'passed',
                'quality_notes' => 'All batches verified. Packaging intact, expiry dates confirmed.',
                'notes' => 'Delivered via Kariakoo Express Logistics',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'purchase_order_id' => $poIds['PO-2026-0002'],
                'grn_number' => 'GRN-2026-0002',
                'received_date' => '2026-02-18',
                'received_by' => 3,
                'supplier_id' => $suppliers['CardioVita Pharma'],
                'total_items' => 210,
                'total_value' => 1010.20,
                'status' => 'complete',
                'quality_check' => 'passed',
                'quality_notes' => 'Cold chain maintained throughout transit. All temperature logs verified.',
                'notes' => 'Priority delivery - temperature sensitive items',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('goods_received')->insert($records);
    }

    private function seedStockTransfers(): void
    {
        $now = now();

        $transfers = [
            [
                'pharmacy_id' => 1,
                'transfer_number' => 'STK-2026-0001',
                'from_location' => 'Main Warehouse - Kariakoo',
                'to_location' => 'Display Shelf A - Front Store',
                'status' => 'completed',
                'total_items' => 3,
                'total_value' => 385.00,
                'requested_by' => 3,
                'approved_by' => 2,
                'approved_at' => '2026-03-05 08:00:00',
                'shipped_at' => '2026-03-05 10:30:00',
                'received_at' => '2026-03-05 14:00:00',
                'notes' => 'Restocking fast-moving items for customer accessibility',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'transfer_number' => 'STK-2026-0002',
                'from_location' => 'Cold Storage Unit - Back Room',
                'to_location' => 'Refrigerated Display Case',
                'status' => 'completed',
                'total_items' => 2,
                'total_value' => 165.00,
                'requested_by' => 3,
                'approved_by' => 2,
                'approved_at' => '2026-05-12 09:00:00',
                'shipped_at' => '2026-05-12 11:00:00',
                'received_at' => '2026-05-12 12:30:00',
                'notes' => 'Monthly cold chain rotation to maintain proper storage temperatures',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('stock_transfers')->insert($transfers);

        $transferIds = [];
        foreach ($transfers as $transfer) {
            $transferIds[$transfer['transfer_number']] = DB::table('stock_transfers')
                ->where('transfer_number', $transfer['transfer_number'])
                ->value('id');
        }

        $transferItems = [
            [
                'stock_transfer_id' => $transferIds['STK-2026-0001'],
                'drug_id' => 2,
                'quantity_sent' => 100,
                'quantity_received' => 100,
                'batch_number' => 'BATCH-PAR-002',
                'expiry_date' => '2027-06-20',
                'notes' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'stock_transfer_id' => $transferIds['STK-2026-0001'],
                'drug_id' => 6,
                'quantity_sent' => 50,
                'quantity_received' => 50,
                'batch_number' => 'BATCH-CET-006',
                'expiry_date' => '2027-03-25',
                'notes' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'stock_transfer_id' => $transferIds['STK-2026-0001'],
                'drug_id' => 10,
                'quantity_sent' => 40,
                'quantity_received' => 40,
                'batch_number' => 'BATCH-IBU-010',
                'expiry_date' => '2027-07-20',
                'notes' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'stock_transfer_id' => $transferIds['STK-2026-0002'],
                'drug_id' => 7,
                'quantity_sent' => 2,
                'quantity_received' => 2,
                'batch_number' => 'BATCH-SAL-007',
                'expiry_date' => '2027-08-20',
                'notes' => 'Requires cold chain storage',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'stock_transfer_id' => $transferIds['STK-2026-0002'],
                'drug_id' => 19,
                'quantity_sent' => 10,
                'quantity_received' => 10,
                'batch_number' => 'BATCH-MVS-019',
                'expiry_date' => '2026-09-15',
                'notes' => 'Children syrup - keep refrigerated',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('stock_transfer_items')->insert($transferItems);
    }

    private function seedStockReturns(array $suppliers): void
    {
        $now = now();

        DB::table('stock_returns')->insert([
            'pharmacy_id' => 1,
            'supplier_id' => $suppliers['HealthCare Tanzania'],
            'return_number' => 'SR-2026-0001',
            'return_date' => '2026-06-25',
            'reason' => 'damaged',
            'status' => 'refunded',
            'total_items' => 2,
            'total_value' => 95.00,
            'notes' => 'Metformin batch received with damaged packaging during transit from Arusha. Supplier agreed to full refund.',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $returnId = DB::table('stock_returns')
            ->where('return_number', 'SR-2026-0001')
            ->value('id');

        DB::table('stock_return_items')->insert([
            [
                'stock_return_id' => $returnId,
                'drug_id' => 3,
                'quantity' => 15,
                'unit_cost' => 4.00,
                'batch_number' => 'BATCH-MET-2606',
                'expiry_date' => '2027-09-30',
                'reason_notes' => 'Outer carton crushed during delivery. Inner blister packs contaminated with moisture.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'stock_return_id' => $returnId,
                'drug_id' => 5,
                'quantity' => 10,
                'unit_cost' => 3.50,
                'batch_number' => 'BATCH-OMP-2606',
                'expiry_date' => '2027-08-01',
                'reason_notes' => 'Capsules discolored upon arrival. Possible cold chain breach during transport.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    private function seedDamagedGoods(): void
    {
        $now = now();

        $records = [
            [
                'pharmacy_id' => 1,
                'drug_id' => 19,
                'damage_number' => 'DMG-2026-0001',
                'damage_date' => '2026-04-10',
                'quantity' => 5,
                'unit_cost' => 3.50,
                'total_loss' => 17.50,
                'reason' => 'expired',
                'reported_by' => 3,
                'disposal_method' => 'documented_disposal',
                'notes' => 'Multivitamin Syrup bottles found past expiry during monthly stock check. Batch BATCH-MVS-019 expired 2026-03-15.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'drug_id' => 7,
                'damage_number' => 'DMG-2026-0002',
                'damage_date' => '2026-05-22',
                'quantity' => 1,
                'unit_cost' => 12.00,
                'total_loss' => 12.00,
                'reason' => 'damaged',
                'reported_by' => 3,
                'disposal_method' => 'returned_to_supplier',
                'notes' => 'Salbutamol Inhaler nozzle cracked during handling. Returned to DermaCare Labs for replacement.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'drug_id' => 20,
                'damage_number' => 'DMG-2026-0003',
                'damage_date' => '2026-06-18',
                'quantity' => 8,
                'unit_cost' => 4.50,
                'total_loss' => 36.00,
                'reason' => 'contaminated',
                'reported_by' => 3,
                'disposal_method' => 'documented_disposal',
                'notes' => 'Benzoyl Peroxide tubes water damaged during heavy rains causing roof leak in storage area. Product compromised and unsellable.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('damaged_goods')->insert($records);
    }

    private function seedControlledSubstances(): void
    {
        $now = now();

        $records = [
            [
                'pharmacy_id' => 1,
                'drug_id' => 1,
                'schedule' => 'schedule_iii',
                'register_number' => 'CSR-2026-0001',
                'date_received' => '2026-01-24',
                'quantity_received' => 200,
                'balance_stock' => 135,
                'issued_to' => 'Muhimbili National Hospital',
                'quantity_issued' => 65,
                'issue_date' => '2026-03-15',
                'issuing_pharmacist_id' => 3,
                'receiving_person_name' => 'Dr. James Mkwawa',
                'receiving_person_id_number' => 'NIDA-1985-12345-67890',
                'witness_name' => 'Amina Juma',
                'witness_id_number' => 'NIDA-1990-54321-09876',
                'notes' => 'Amoxicillin 500mg dispensed to hospital pharmacy under Schedule III controlled substance protocol',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'drug_id' => 16,
                'schedule' => 'schedule_ii',
                'register_number' => 'CSR-2026-0002',
                'date_received' => '2026-02-18',
                'quantity_received' => 100,
                'balance_stock' => 78,
                'issued_to' => 'Aga Khan Hospital Outpatient',
                'quantity_issued' => 22,
                'issue_date' => '2026-04-10',
                'issuing_pharmacist_id' => 3,
                'receiving_person_name' => 'Nurse Fatima Hussein',
                'receiving_person_id_number' => 'NIDA-1992-67890-12345',
                'witness_name' => 'Fatima Omari',
                'witness_id_number' => 'NIDA-1988-11111-22222',
                'notes' => 'Prednisolone 5mg dispensed under Schedule II - requires dual pharmacist verification',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'drug_id' => 11,
                'schedule' => 'schedule_iii',
                'register_number' => 'CSR-2026-0003',
                'date_received' => '2026-03-01',
                'quantity_received' => 50,
                'balance_stock' => 38,
                'issued_to' => null,
                'quantity_issued' => 12,
                'issue_date' => '2026-05-20',
                'issuing_pharmacist_id' => 3,
                'receiving_person_name' => 'Peter Mushi',
                'receiving_person_id_number' => 'NIDA-1987-99999-00000',
                'witness_name' => 'Rehema Mwangaza',
                'witness_id_number' => 'NIDA-1995-88888-77777',
                'notes' => 'Azithromycin 250mg dispensed to walk-in customer with valid prescription from Dr. Mtembei',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('controlled_substances')->insert($records);
    }

    private function seedDrugRecalls(): void
    {
        $now = now();

        $records = [
            [
                'pharmacy_id' => 1,
                'drug_id' => 8,
                'recall_number' => 'RC-2026-0001',
                'recall_reason' => 'contamination',
                'severity' => 'class_i',
                'manufacturer' => 'DermaCare Labs',
                'batch_numbers' => json_encode(['BATCH-HYD-2508', 'BATCH-HYD-2510']),
                'date_issued' => '2026-03-01',
                'date_acknowledged' => '2026-03-03',
                'affected_quantity' => 20,
                'returned_quantity' => 20,
                'status' => 'completed',
                'notes' => 'Class I recall - Hydrocortisone Cream batches found to contain bacterial contamination at manufacturing facility. All affected stock quarantined and returned to supplier. No adverse patient reactions reported in Tanzania.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'drug_id' => 20,
                'recall_number' => 'RC-2026-0002',
                'recall_reason' => 'labeling',
                'severity' => 'class_ii',
                'manufacturer' => 'DermaCare Labs',
                'batch_numbers' => json_encode(['BATCH-BPO-2601']),
                'date_issued' => '2026-06-10',
                'date_acknowledged' => '2026-06-12',
                'affected_quantity' => 12,
                'returned_quantity' => 4,
                'status' => 'completed',
                'notes' => 'Class II recall - Benzoyl Peroxide 5% tubes labeled with incorrect concentration (labeled as 2.5%). Affected stock quarantined. Remaining stock corrected with updated labels per FDA Tanzania guidance.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('drug_recalls')->insert($records);
    }
}
