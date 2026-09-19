<?php

namespace Database\Seeders;

use App\Models\Delivery;
use App\Models\Order;
use App\Models\User;
use Faker\Factory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DeliveriesSeeder extends Seeder
{
    public function run(): void
    {
        $orders = Order::where('pharmacy_id', 1)->get();
        $driver = User::where('role', 'pharmacist')->first();
        $faker = Factory::create();

        $customerNames = [
            'Grace Hospital', 'Alice Mwamba', 'Bob Phiri', 'City Clinic', 'Carol Banda',
            'Mwananyamala Health Centre', 'David Mwangi', 'Elizabeth Kimaro', 'Frank Ochieng',
            'Genesis Medical Centre', 'Helen Nkosi', 'Ian Safari', 'Jackline Kimbikimbi',
            'Karen Ng\'wandu', 'Leo Mtembei', 'Martha Lwakatare', 'Nathan Mahozi',
            'Olivia Shighi', 'Patrick Mwakajila', 'Queen Mwamba', 'Rachel Ntayi',
            'Samuel Mkumbwa', 'Teresa Mziray', 'Ulrich Olotu', 'Victoria Mushi',
            'William Mtelekano', 'Xavier Mwaipopo', 'Yvette Mwamba', 'Zainab Lwakatare',
            'Anthony Mwamba', 'Beatrice Tandau', 'Charles Moyo', 'Diana Shirima',
            'Edward Kimaro', 'Fatuma Hassan',
        ];
        $tzLocations = [
            'Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Tanga',
            'Mbeya', 'Morogoro', 'Iringa', 'Kilimanjaro', 'Lindi',
            'Mtwara', 'Njombe', 'Ruvuma', 'Shinyanga', 'Singida',
            'Tabora', 'Kagera', 'Mara', 'Simiyu', 'Geita',
            'Katavi', 'Kigoma', 'Pwani', 'Manyara', 'Songwe',
            'Rukwa', 'Zanzibar', 'Kaskazini Unguja', 'Kusini Unguja', 'Mjini Magharibi',
            'Kaskazini Pemba', 'Kusini Pemba', 'Bukoba', 'Musoma', 'Sumbawanga',
        ];
        $statuses = [
            'delivered', 'delivered', 'delivered', 'delivered', 'delivered',
            'delivered', 'delivered', 'delivered', 'in_transit', 'in_transit',
            'pending', 'pending', 'pending',
        ];
        $records = [];

        for ($i = 0; $i < 35; $i++) {
            $region = $tzLocations[$i % count($tzLocations)];
            $name = $customerNames[$i % count($customerNames)];
            $daysAgo = rand(0, 20);
            $status = $statuses[$i % count($statuses)];

            $records[] = [
                'pharmacy_id' => 1,
                'order_id' => $orders[$i % max(1, $orders->count())]?->id ?? 1,
                'delivery_code' => 'DLV-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                'customer_name' => $name,
                'customer_phone' => '+255700' . str_pad($i, 8, '0', STR_PAD_LEFT),
                'delivery_address' => $faker->streetName . ', ' . $region,
                'delivery_fee' => rand(2000, 8000),
                'status' => $status,
                'assigned_to' => $driver?->id,
                'estimated_arrival' => now()->subDays($daysAgo)->addHours(rand(1, 5)),
                'actual_arrival' => $status === 'delivered' ? now()->subDays($daysAgo)->addHours(rand(1, 4)) : null,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('deliveries')->insert($records);
    }
}
