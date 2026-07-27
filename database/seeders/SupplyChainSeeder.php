<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Faker\Factory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupplyChainSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $faker = Factory::create();
        $now = now();

        $suppliers = $this->seedSuppliers($faker, $now);
        $poIds = $this->seedPurchaseOrders($faker, $now, $suppliers);
        $this->seedPurchaseOrderItems($faker, $now, $poIds);
        $goodsReceivedIds = $this->seedGoodsReceived($faker, $now, $poIds, $suppliers);
        $transferIds = $this->seedStockTransfers($faker, $now);
        $this->seedStockTransferItems($faker, $now, $transferIds);
        $returnIds = $this->seedStockReturns($faker, $now, $suppliers);
        $this->seedStockReturnItems($faker, $now, $returnIds);
        $this->seedDamagedGoods($faker, $now);
        $this->seedControlledSubstances($faker, $now);
        $this->seedDrugRecalls($faker, $now);

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    private function seedSuppliers($faker, $now): array
    {
        $supplierNames = [
            'Generic Pharma Ltd', 'HealthCare Tanzania', 'NutriVita Ltd',
            'CardioVita Pharma', 'DermaCare Labs', 'MedSupply East Africa',
            'PharmaDistributors TZ', 'LifeLine Medical Supplies', 'Apex Pharma Solutions',
            'Vitality Health Distributors', 'EastAfrica Pharma Corp', 'SwiftMed Supplies',
            'CareFirst Pharmaceuticals', 'BioMed Tanzania Ltd', 'PrimeHealth Distributors',
            'PharmaLink Africa', 'MediSource International', 'TrueCare Pharma',
            'Summit Pharma Supply', 'WellnessPlus Distributors', 'GlobalMed Tanzania',
            'African Pharma Hub', 'TrustPharm Supplies', 'PrecisionPharma Ltd',
            'Zenith Medical Distributors', 'OptimaHealth Supply Co', 'PharmaBridge Africa',
            'MedVault Supply Chain', 'ClearPath Pharmaceuticals', 'Evergreen Pharma Supply',
            'AlphaPharma Tanzania', 'NovaMed Distributors', 'PureHealth Supplies',
            'Skyline Pharma Ltd', 'GoldenDrug Distributors',
        ];

        $cities = [
            'Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Zanzibar City',
            'Mbeya', 'Tanga', 'Morogoro', 'Iringa', 'Kigoma', 'Kilimanjaro',
            'Lindi', 'Mtwara', 'Njombe', 'Ruvuma', 'Shinyanga', 'Singida',
            'Tabora', 'Kagera', 'Mara', 'Simiyu', 'Geita', 'Katavi',
            'Songwe', 'Pwani', 'Rukwa', 'Manyara',
        ];
        $countries = ['Tanzania', 'Tanzania', 'Tanzania', 'Tanzania', 'Tanzania', 'Tanzania', 'Kenya', 'Uganda', 'Rwanda', 'Burundi'];
        $paymentTerms = ['net_15', 'net_30', 'net_60', 'cod'];
        $data = [];

        for ($i = 0; $i < 35; $i++) {
            $cityIndex = $i % count($cities);
            $data[] = [
                'pharmacy_id' => ($i % 6) + 1,
                'name' => $supplierNames[$i],
                'contact_person' => $faker->name,
                'email' => $faker->unique()->safeEmail,
                'phone' => '+255' . $faker->numerify('### ### ####'),
                'address' => $faker->streetAddress . ', ' . $cities[$cityIndex],
                'city' => $cities[$cityIndex],
                'country' => $countries[$i % count($countries)],
                'tax_id' => 'TIN-' . $faker->numerify('###-###-###'),
                'payment_terms' => $paymentTerms[$i % count($paymentTerms)],
                'rating' => round($faker->randomFloat(2, 3.0, 5.0), 2),
                'total_orders' => $faker->numberBetween(2, 25),
                'total_purchased' => $faker->randomFloat(2, 50000, 2000000),
                'is_active' => $faker->boolean(85),
                'notes' => $faker->sentence(12),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('suppliers')->insert($data);

        return DB::table('suppliers')->pluck('id', 'name')->toArray();
    }

    private function seedPurchaseOrders($faker, $now, array $suppliers): array
    {
        $supplierIds = array_values($suppliers);
        $statuses = ['draft', 'pending_approval', 'approved', 'approved', 'approved', 'received', 'received', 'received', 'cancelled'];
        $paymentStatuses = ['unpaid', 'partial', 'paid', 'paid', 'paid'];
        $orders = [];

        for ($i = 1; $i <= 35; $i++) {
            $status = $faker->randomElement($statuses);
            $orderDate = $faker->dateTimeBetween('-6 months', '-2 weeks');
            $orderDateCarbon = Carbon::instance($orderDate);
            $expectedDelivery = $orderDateCarbon->copy()->addDays($faker->numberBetween(5, 20));
            $subtotal = $faker->randomFloat(2, 200, 5000);
            $taxRate = 0.18;
            $taxAmount = round($subtotal * $taxRate, 2);
            $discount = $faker->boolean(30) ? $faker->randomFloat(2, 10, $subtotal * 0.15) : 0;
            $total = round($subtotal + $taxAmount - $discount, 2);
            $pStatus = $status === 'received' ? 'paid' : ($status === 'cancelled' ? 'unpaid' : $faker->randomElement($paymentStatuses));

            $receivedAt = null;
            $receivedBy = null;
            $approvedAt = null;
            $approvedBy = null;

            if (in_array($status, ['approved', 'received', 'cancelled'])) {
                $approvedAt = $orderDateCarbon->copy()->addHours($faker->numberBetween(2, 48))->toDateTimeString();
                $approvedBy = $faker->numberBetween(1, 10);
            }
            if ($status === 'received') {
                $receivedAt = $orderDateCarbon->copy()->addDays($faker->numberBetween(5, 18))->toDateTimeString();
                $receivedBy = $faker->numberBetween(1, 15);
            }

            $orders[] = [
                'pharmacy_id' => $faker->numberBetween(1, 6),
                'supplier_id' => $faker->randomElement($supplierIds),
                'order_number' => 'PO-2026-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'order_date' => $orderDateCarbon->format('Y-m-d'),
                'expected_delivery_date' => $expectedDelivery->format('Y-m-d'),
                'status' => $status,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'discount_amount' => $discount,
                'total' => $total,
                'payment_status' => $pStatus,
                'amount_paid' => $pStatus === 'paid' ? $total : ($pStatus === 'partial' ? round($total * $faker->randomFloat(2, 0.3, 0.7), 2) : 0),
                'notes' => $faker->sentence(8),
                'approved_by' => $approvedBy,
                'approved_at' => $approvedAt,
                'received_by' => $receivedBy,
                'received_at' => $receivedAt,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('purchase_orders')->insert($orders);

        $poIds = [];
        foreach ($orders as $order) {
            $poIds[$order['order_number']] = DB::table('purchase_orders')
                ->where('order_number', $order['order_number'])
                ->value('id');
        }

        return $poIds;
    }

    private function seedPurchaseOrderItems($faker, $now, array $poIds): void
    {
        $poValues = array_values($poIds);
        $items = [];

        for ($i = 1; $i <= 45; $i++) {
            $poId = $faker->randomElement($poValues);
            $quantity = $faker->numberBetween(10, 300);
            $unitCost = $faker->randomFloat(2, 1, 25);
            $totalCost = round($quantity * $unitCost, 2);

            $items[] = [
                'purchase_order_id' => $poId,
                'drug_id' => $faker->numberBetween(1, 50),
                'quantity_ordered' => $quantity,
                'quantity_received' => $faker->numberBetween(0, $quantity),
                'unit_cost' => $unitCost,
                'total_cost' => $totalCost,
                'batch_number' => 'BATCH-' . strtoupper($faker->bothify('???-####')),
                'expiry_date' => $faker->dateTimeBetween('+6 months', '+36 months')->format('Y-m-d'),
                'notes' => $faker->boolean(20) ? $faker->sentence(6) : null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('purchase_order_items')->insert($items);
    }

    private function seedGoodsReceived($faker, $now, array $poIds, array $suppliers): array
    {
        $supplierIds = array_values($suppliers);
        $poValues = array_values($poIds);
        $statuses = ['complete', 'complete', 'complete', 'partial'];
        $qualityChecks = ['passed', 'passed', 'passed', 'pending', 'failed'];
        $records = [];

        for ($i = 1; $i <= 35; $i++) {
            $receivedDate = $faker->dateTimeBetween('-6 months', '-1 week');
            $receivedDateCarbon = Carbon::instance($receivedDate);
            $totalItems = $faker->numberBetween(20, 500);
            $totalValue = $faker->randomFloat(2, 100, 8000);

            $records[] = [
                'pharmacy_id' => $faker->numberBetween(1, 6),
                'purchase_order_id' => $faker->randomElement($poValues),
                'grn_number' => 'GRN-2026-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'received_date' => $receivedDateCarbon->format('Y-m-d'),
                'received_by' => $faker->numberBetween(1, 15),
                'supplier_id' => $faker->randomElement($supplierIds),
                'total_items' => $totalItems,
                'total_value' => $totalValue,
                'status' => $faker->randomElement($statuses),
                'quality_check' => $faker->randomElement($qualityChecks),
                'quality_notes' => $faker->sentence(10),
                'notes' => $faker->sentence(8),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('goods_received')->insert($records);

        $grnIds = [];
        foreach ($records as $record) {
            $grnIds[$record['grn_number']] = DB::table('goods_received')
                ->where('grn_number', $record['grn_number'])
                ->value('id');
        }

        return $grnIds;
    }

    private function seedStockTransfers($faker, $now): array
    {
        $transferStatuses = ['pending', 'approved', 'in_transit', 'completed', 'completed', 'completed'];
        $locations = [
            'Main Warehouse - Kariakoo', 'Branch Store - Mwananyamala',
            'Cold Storage Unit - Ilala', 'Display Shelf A - Front Store',
            'Refrigerated Display - Kinondoni', 'Dispensing Counter - Temeke',
            'Emergency Stock Room - Masaki', 'Overflow Warehouse - Mikocheni',
            'Distribution Hub - Arusha', 'Regional Store - Mwanza',
            'Central Depot - Dodoma', 'Zanzibar Storage - Stone Town',
            'Southern Warehouse - Mbeya', 'Coastal Depot - Tanga',
            'Eastern Store - Morogoro', 'Highland Depot - Iringa',
        ];

        $transfers = [];

        for ($i = 1; $i <= 35; $i++) {
            $fromPharmacy = $faker->numberBetween(1, 6);
            $toPharmacy = $faker->numberBetween(1, 6);
            while ($toPharmacy === $fromPharmacy) {
                $toPharmacy = $faker->numberBetween(1, 6);
            }

            $status = $faker->randomElement($transferStatuses);
            $createdAt = $faker->dateTimeBetween('-6 months', '-2 weeks');
            $createdAtCarbon = Carbon::instance($createdAt);

            $approvedAt = null;
            $shippedAt = null;
            $receivedAt = null;

            if (in_array($status, ['approved', 'in_transit', 'completed'])) {
                $approvedAt = $createdAtCarbon->copy()->addHours($faker->numberBetween(1, 24))->toDateTimeString();
            }
            if (in_array($status, ['in_transit', 'completed'])) {
                $shippedAt = $createdAtCarbon->copy()->addDays($faker->numberBetween(1, 5))->toDateTimeString();
            }
            if ($status === 'completed') {
                $receivedAt = $createdAtCarbon->copy()->addDays($faker->numberBetween(2, 10))->toDateTimeString();
            }

            $transfers[] = [
                'pharmacy_id' => $fromPharmacy,
                'transfer_number' => 'STK-2026-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'from_location' => $faker->randomElement($locations),
                'to_location' => $faker->randomElement($locations),
                'status' => $status,
                'total_items' => $faker->numberBetween(1, 10),
                'total_value' => $faker->randomFloat(2, 20, 2000),
                'requested_by' => $faker->numberBetween(1, 15),
                'approved_by' => in_array($status, ['approved', 'in_transit', 'completed']) ? $faker->numberBetween(1, 10) : null,
                'approved_at' => $approvedAt,
                'shipped_at' => $shippedAt,
                'received_at' => $receivedAt,
                'notes' => $faker->sentence(8),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('stock_transfers')->insert($transfers);

        $transferIds = [];
        foreach ($transfers as $transfer) {
            $transferIds[$transfer['transfer_number']] = DB::table('stock_transfers')
                ->where('transfer_number', $transfer['transfer_number'])
                ->value('id');
        }

        return $transferIds;
    }

    private function seedStockTransferItems($faker, $now, array $transferIds): void
    {
        $transferValues = array_values($transferIds);
        $items = [];

        for ($i = 1; $i <= 45; $i++) {
            $quantitySent = $faker->numberBetween(5, 200);

            $items[] = [
                'stock_transfer_id' => $faker->randomElement($transferValues),
                'drug_id' => $faker->numberBetween(1, 50),
                'quantity_sent' => $quantitySent,
                'quantity_received' => $faker->numberBetween(0, $quantitySent),
                'batch_number' => 'BATCH-' . strtoupper($faker->bothify('???-####')),
                'expiry_date' => $faker->dateTimeBetween('+6 months', '+36 months')->format('Y-m-d'),
                'notes' => $faker->boolean(15) ? $faker->sentence(5) : null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('stock_transfer_items')->insert($items);
    }

    private function seedStockReturns($faker, $now, array $suppliers): array
    {
        $supplierIds = array_values($suppliers);
        $returnReasons = ['damaged', 'expired', 'wrong_item', 'quality_issue', 'overstock'];
        $statuses = ['pending', 'approved', 'shipped', 'refunded', 'approved'];

        $returns = [];

        for ($i = 1; $i <= 35; $i++) {
            $returnDate = $faker->dateTimeBetween('-6 months', '-1 week');
            $totalItems = $faker->numberBetween(1, 20);
            $totalValue = $faker->randomFloat(2, 15, 1500);

            $returns[] = [
                'pharmacy_id' => $faker->numberBetween(1, 6),
                'supplier_id' => $faker->randomElement($supplierIds),
                'return_number' => 'SR-2026-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'return_date' => Carbon::instance($returnDate)->format('Y-m-d'),
                'reason' => $faker->randomElement($returnReasons),
                'status' => $faker->randomElement($statuses),
                'total_items' => $totalItems,
                'total_value' => $totalValue,
                'notes' => $faker->sentence(10),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('stock_returns')->insert($returns);

        $returnIds = [];
        foreach ($returns as $return) {
            $returnIds[$return['return_number']] = DB::table('stock_returns')
                ->where('return_number', $return['return_number'])
                ->value('id');
        }

        return $returnIds;
    }

    private function seedStockReturnItems($faker, $now, array $returnIds): void
    {
        $returnValues = array_values($returnIds);
        $items = [];

        for ($i = 1; $i <= 45; $i++) {
            $quantity = $faker->numberBetween(1, 50);
            $unitCost = $faker->randomFloat(2, 1, 20);

            $items[] = [
                'stock_return_id' => $faker->randomElement($returnValues),
                'drug_id' => $faker->numberBetween(1, 50),
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'batch_number' => 'BATCH-' . strtoupper($faker->bothify('???-####')),
                'expiry_date' => $faker->dateTimeBetween('+3 months', '+24 months')->format('Y-m-d'),
                'reason_notes' => $faker->sentence(10),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('stock_return_items')->insert($items);
    }

    private function seedDamagedGoods($faker, $now): void
    {
        $damageReasons = ['expired', 'damaged', 'contaminated', 'recalled', 'stolen'];
        $disposalMethods = ['documented_disposal', 'returned_to_supplier', 'donated', 'documented_disposal'];
        $records = [];

        for ($i = 1; $i <= 35; $i++) {
            $quantity = $faker->numberBetween(1, 30);
            $unitCost = $faker->randomFloat(2, 1, 25);

            $records[] = [
                'pharmacy_id' => $faker->numberBetween(1, 6),
                'drug_id' => $faker->numberBetween(1, 50),
                'damage_number' => 'DMG-2026-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'damage_date' => $faker->dateTimeBetween('-6 months', '-1 week')->format('Y-m-d'),
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'total_loss' => round($quantity * $unitCost, 2),
                'reason' => $faker->randomElement($damageReasons),
                'reported_by' => $faker->numberBetween(1, 15),
                'disposal_method' => $faker->randomElement($disposalMethods),
                'notes' => $faker->sentence(12),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('damaged_goods')->insert($records);
    }

    private function seedControlledSubstances($faker, $now): void
    {
        $schedules = ['schedule_ii', 'schedule_iii', 'schedule_ii', 'schedule_iii', 'schedule_i'];
        $hospitals = [
            'Muhimbili National Hospital', 'Aga Khan Hospital',
            'Catholic University Hospital', 'Temeke District Hospital',
            'Ilala District Hospital', 'Kilimanjaro Christian Medical Centre',
            'Bugando Medical Centre', 'Mbeya Zonal Hospital',
            'Arusha Lutheran Medical Centre', 'Dodoma Medical Centre',
            'Tanga Regional Hospital', 'Morogoro Regional Hospital',
            'Mwananyamala District Hospital', 'Amana District Hospital',
            'Mtwara Regional Hospital', 'Lindi Regional Hospital',
            'Iringa Regional Hospital', 'Kigoma District Hospital',
            'Singida Regional Hospital', 'Njombe Regional Hospital',
            'Bugando Medical Centre Mwanza', 'Geita Regional Hospital',
            'Songea Regional Hospital', 'Shinyanga District Hospital',
            'Bukoba Regional Hospital', 'Musoma District Hospital',
        ];

        $records = [];

        for ($i = 1; $i <= 35; $i++) {
            $qtyReceived = $faker->numberBetween(30, 300);
            $qtyIssued = $faker->numberBetween(5, $qtyReceived - 5);

            $records[] = [
                'pharmacy_id' => $faker->numberBetween(1, 6),
                'drug_id' => $faker->numberBetween(1, 50),
                'schedule' => $faker->randomElement($schedules),
                'register_number' => 'CSR-2026-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'date_received' => $faker->dateTimeBetween('-6 months', '-2 weeks')->format('Y-m-d'),
                'quantity_received' => $qtyReceived,
                'balance_stock' => $qtyReceived - $qtyIssued,
                'issued_to' => $faker->randomElement($hospitals),
                'quantity_issued' => $qtyIssued,
                'issue_date' => $faker->dateTimeBetween('-5 months', '-1 week')->format('Y-m-d'),
                'issuing_pharmacist_id' => $faker->numberBetween(1, 10),
                'receiving_person_name' => $faker->name,
                'receiving_person_id_number' => 'NIDA-' . $faker->year('Y') . '-' . $faker->numerify('#####') . '-' . $faker->numerify('#####'),
                'witness_name' => $faker->name,
                'witness_id_number' => 'NIDA-' . $faker->year('Y') . '-' . $faker->numerify('#####') . '-' . $faker->numerify('#####'),
                'notes' => $faker->sentence(10),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('controlled_substances')->insert($records);
    }

    private function seedDrugRecalls($faker, $now): void
    {
        $recallReasons = ['contamination', 'labeling', 'defective', 'efficacy', 'safety', 'labeling'];
        $severities = ['class_i', 'class_ii', 'class_iii'];
        $manufacturers = [
            'DermaCare Labs', 'Generic Pharma Ltd', 'CardioVita Pharma',
            'NutriVita Ltd', 'HealthCare Tanzania', 'MedSupply East Africa',
            'PharmaDistributors TZ', 'LifeLine Medical Supplies',
        ];
        $recallStatuses = ['pending', 'in_progress', 'completed', 'completed', 'completed'];

        $records = [];

        for ($i = 1; $i <= 35; $i++) {
            $dateIssued = $faker->dateTimeBetween('-6 months', '-2 weeks');
            $dateIssuedCarbon = Carbon::instance($dateIssued);
            $affectedQty = $faker->numberBetween(5, 100);

            $dateAcknowledged = $faker->boolean(80)
                ? $dateIssuedCarbon->copy()->addDays($faker->numberBetween(1, 10))->toDateString()
                : null;

            $status = $faker->randomElement($recallStatuses);

            $records[] = [
                'pharmacy_id' => $faker->numberBetween(1, 6),
                'drug_id' => $faker->numberBetween(1, 50),
                'recall_number' => 'RC-2026-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'recall_reason' => $faker->randomElement($recallReasons),
                'severity' => $faker->randomElement($severities),
                'manufacturer' => $faker->randomElement($manufacturers),
                'batch_numbers' => json_encode([$faker->bothify('BATCH-???-####'), $faker->bothify('BATCH-???-####')]),
                'date_issued' => $dateIssuedCarbon->format('Y-m-d'),
                'date_acknowledged' => $dateAcknowledged,
                'affected_quantity' => $affectedQty,
                'returned_quantity' => $status === 'completed' ? $faker->numberBetween(0, $affectedQty) : 0,
                'status' => $status,
                'notes' => $faker->sentence(14),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('drug_recalls')->insert($records);
    }
}
