<?php

namespace Database\Seeders;

use App\Models\Delivery;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Seeder;

class DeliveriesSeeder extends Seeder
{
    public function run(): void
    {
        $orders = Order::where('pharmacy_id', 1)->get();
        $driver = User::where('role', 'pharmacist')->first();

        $deliveries = [
            [
                'order_index' => 0,
                'delivery_code' => 'DLV-0001',
                'customer_name' => 'Grace Hospital',
                'customer_phone' => '+255700000010',
                'delivery_address' => 'Sokoine Drive, Dar es Salaam',
                'delivery_fee' => 5000,
                'status' => 'delivered',
                'estimated_arrival' => now()->subDays(10)->addHours(2),
                'actual_arrival' => now()->subDays(10)->addHours(1),
            ],
            [
                'order_index' => 1,
                'delivery_code' => 'DLV-0002',
                'customer_name' => 'Alice Mwamba',
                'customer_phone' => '+255700000011',
                'delivery_address' => 'Mtaa wa Amani, Dar es Salaam',
                'delivery_fee' => 3000,
                'status' => 'delivered',
                'estimated_arrival' => now()->subDays(8)->addHours(2),
                'actual_arrival' => now()->subDays(8)->addHours(3),
            ],
            [
                'order_index' => 3,
                'delivery_code' => 'DLV-0003',
                'customer_name' => 'City Clinic',
                'customer_phone' => '+255700000013',
                'delivery_address' => 'Ohio Street, Dar es Salaam',
                'delivery_fee' => 5000,
                'status' => 'delivered',
                'estimated_arrival' => now()->subDays(5)->addHours(3),
                'actual_arrival' => now()->subDays(5)->addHours(2),
            ],
            [
                'order_index' => 8,
                'delivery_code' => 'DLV-0004',
                'customer_name' => 'City Clinic',
                'customer_phone' => '+255700000013',
                'delivery_address' => 'Ohio Street, Dar es Salaam',
                'delivery_fee' => 5000,
                'status' => 'in_transit',
                'estimated_arrival' => now()->addHours(1),
            ],
            [
                'order_index' => 9,
                'delivery_code' => 'DLV-0005',
                'customer_name' => 'Carol Banda',
                'customer_phone' => '+255700000014',
                'delivery_address' => 'Mikocheni, Dar es Salaam',
                'delivery_fee' => 3500,
                'status' => 'pending',
            ],
        ];

        foreach ($deliveries as $delivery) {
            $order = $orders[$delivery['order_index']] ?? $orders->first();
            if (!$order) continue;

            Delivery::create([
                'pharmacy_id' => 1,
                'order_id' => $order->id,
                'delivery_code' => $delivery['delivery_code'],
                'customer_name' => $delivery['customer_name'],
                'customer_phone' => $delivery['customer_phone'],
                'delivery_address' => $delivery['delivery_address'],
                'delivery_fee' => $delivery['delivery_fee'],
                'status' => $delivery['status'],
                'assigned_to' => $driver?->id,
                'estimated_arrival' => $delivery['estimated_arrival'] ?? null,
                'actual_arrival' => $delivery['actual_arrival'] ?? null,
            ]);
        }
    }
}
