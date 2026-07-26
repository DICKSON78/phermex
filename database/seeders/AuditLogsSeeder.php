<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Seeder;

class AuditLogsSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();
        $owner = User::where('role', 'owner')->first();
        $pharmacist = User::where('role', 'pharmacist')->first();

        $logs = [
            [
                'user_id' => $admin?->id,
                'action' => 'created',
                'model_type' => 'App\\Models\\Pharmacy',
                'model_id' => 1,
                'new_values' => ['pharmacy_name' => 'Mwalimu Pharmacy', 'status' => 'active'],
                'ip_address' => '192.168.1.100',
            ],
            [
                'user_id' => $owner?->id,
                'action' => 'updated',
                'model_type' => 'App\\Models\\Drug',
                'model_id' => 1,
                'old_values' => ['quantity' => 200],
                'new_values' => ['quantity' => 150],
                'ip_address' => '192.168.1.101',
            ],
            [
                'user_id' => $pharmacist?->id,
                'action' => 'created',
                'model_type' => 'App\\Models\\Order',
                'model_id' => 1,
                'new_values' => ['order_code' => 'ORD-20260001', 'total' => 1475.00],
                'ip_address' => '192.168.1.102',
            ],
            [
                'user_id' => $pharmacist?->id,
                'action' => 'dispensed',
                'model_type' => 'App\\Models\\Prescription',
                'model_id' => 1,
                'new_values' => ['status' => 'dispensed'],
                'ip_address' => '192.168.1.102',
            ],
            [
                'user_id' => $owner?->id,
                'action' => 'updated',
                'model_type' => 'App\\Models\\Pharmacy',
                'model_id' => 1,
                'old_values' => ['monthly_revenue' => 10000],
                'new_values' => ['monthly_revenue' => 12500],
                'ip_address' => '192.168.1.101',
            ],
            [
                'user_id' => $admin?->id,
                'action' => 'updated',
                'model_type' => 'App\\Models\\Subscription',
                'model_id' => 1,
                'old_values' => ['status' => 'pending'],
                'new_values' => ['status' => 'active'],
                'ip_address' => '192.168.1.100',
            ],
            [
                'user_id' => $pharmacist?->id,
                'action' => 'created',
                'model_type' => 'App\\Models\\DrugMovement',
                'model_id' => 1,
                'new_values' => ['movement_type' => 'purchase', 'quantity' => 200],
                'ip_address' => '192.168.1.102',
            ],
            [
                'user_id' => $owner?->id,
                'action' => 'created',
                'model_type' => 'App\\Models\\Expense',
                'model_id' => 1,
                'new_values' => ['category' => 'Rent', 'amount' => 850],
                'ip_address' => '192.168.1.101',
            ],
        ];

        foreach ($logs as $log) {
            AuditLog::create([
                'pharmacy_id' => 1,
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'created_at' => now()->subDays(rand(0, 14)),
                ...$log,
            ]);
        }
    }
}
