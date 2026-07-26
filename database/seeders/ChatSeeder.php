<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ChatSeeder extends Seeder
{
    public function run(): void
    {
        $messages = [
            [
                'pharmacy_id' => 1,
                'sender_id' => 4,
                'receiver_id' => 3,
                'message' => 'Hello! I need to check if you have Amoxicillin 500mg and Paracetamol 500mg in stock. Can you help?',
                'message_type' => 'order_inquiry',
                'is_read' => true,
                'created_at' => now()->subHours(5),
                'updated_at' => now()->subHours(5),
            ],
            [
                'pharmacy_id' => 1,
                'sender_id' => 3,
                'receiver_id' => 4,
                'message' => 'Hi! Yes, we have both in stock. Amoxicillin 500mg is TZS 8.50 per capsule and Paracetamol 500mg is TZS 3.00 per tablet. How many do you need?',
                'message_type' => 'text',
                'is_read' => true,
                'created_at' => now()->subHours(4),
                'updated_at' => now()->subHours(4),
            ],
            [
                'pharmacy_id' => 1,
                'sender_id' => 4,
                'receiver_id' => 3,
                'message' => 'Great! I need 20 capsules of Amoxicillin and 10 tablets of Paracetamol. Do you offer delivery?',
                'message_type' => 'order_inquiry',
                'is_read' => true,
                'created_at' => now()->subHours(3),
                'updated_at' => now()->subHours(3),
            ],
            [
                'pharmacy_id' => 1,
                'sender_id' => 3,
                'receiver_id' => 4,
                'message' => 'Absolutely! We offer free delivery within Dar es Salaam. Delivery usually takes 2-4 hours. We also have same-day delivery for orders placed before 6pm.',
                'message_type' => 'text',
                'is_read' => true,
                'created_at' => now()->subHours(2),
                'updated_at' => now()->subHours(2),
            ],
            [
                'pharmacy_id' => 1,
                'sender_id' => 4,
                'receiver_id' => 3,
                'message' => 'Perfect! I would like to place an order: 20x Amoxicillin 500mg and 10x Paracetamol 500mg. Please deliver to my address.',
                'message_type' => 'order_inquiry',
                'is_read' => true,
                'created_at' => now()->subHour(),
                'updated_at' => now()->subHour(),
            ],
            [
                'pharmacy_id' => 1,
                'sender_id' => 3,
                'receiver_id' => 4,
                'message' => 'Order confirmed! Your total is TZS 200.00 (Amoxicillin: 20x8.50 = 170.00, Paracetamol: 10x3.00 = 30.00). We will deliver within 3 hours. Thank you for your order!',
                'message_type' => 'text',
                'is_read' => false,
                'created_at' => now()->subMinutes(30),
                'updated_at' => now()->subMinutes(30),
            ],
        ];

        DB::table('messages')->insert($messages);
    }
}
