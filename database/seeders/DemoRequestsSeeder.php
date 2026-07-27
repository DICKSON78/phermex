<?php

namespace Database\Seeders;

use Faker\Factory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoRequestsSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Factory::create();
        $now = now();
        $statuses = ['pending', 'pending', 'contacted', 'contacted', 'converted', 'archived'];
        $services = ['Full System Demo', 'Trial Request', 'Pricing Inquiry', 'Feature Walkthrough', 'Partnership Opportunity', null];
        $records = [];

        for ($i = 1; $i <= 35; $i++) {
            $createdAt = $faker->dateTimeBetween('-3 months', 'now');
            $status = $faker->randomElement($statuses);

            $records[] = [
                'name' => $faker->name,
                'email' => $faker->unique()->safeEmail,
                'phone' => '+255' . $faker->numerify('7## ### ###'),
                'pharmacy_name' => $faker->company . ' Pharmacy',
                'service' => $faker->randomElement($services),
                'message' => $faker->sentence(10),
                'status' => $status,
                'created_at' => $createdAt,
                'updated_at' => $now,
            ];
        }

        DB::table('demo_requests')->insert($records);
    }
}
