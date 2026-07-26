<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Seeder;

class NotificationsSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::where('role', 'owner')->first();
        $pharmacist = User::where('role', 'pharmacist')->first();

        $notifications = [
            [
                'user_id' => $owner?->id,
                'title' => 'New Order Received',
                'message' => 'Order ORD-20260001 from Grace Hospital has been placed.',
                'type' => 'info',
                'is_read' => true,
                'link' => '/orders',
            ],
            [
                'user_id' => $owner?->id,
                'title' => 'Low Stock Alert',
                'message' => 'Metformin 850mg is below reorder level. Only 8 units remaining.',
                'type' => 'warning',
                'is_read' => false,
                'link' => '/drugs',
            ],
            [
                'user_id' => $owner?->id,
                'title' => 'Subscription Renewed',
                'message' => 'Your subscription has been renewed for 12 months.',
                'type' => 'success',
                'is_read' => true,
                'link' => '/settings',
            ],
            [
                'user_id' => $pharmacist?->id,
                'title' => 'Prescription Pending',
                'message' => 'RX-20260004 needs to be reviewed and dispensed.',
                'type' => 'info',
                'is_read' => false,
                'link' => '/prescriptions',
            ],
            [
                'user_id' => $pharmacist?->id,
                'title' => 'Delivery Assigned',
                'message' => 'You have been assigned delivery DLV-0004.',
                'type' => 'info',
                'is_read' => false,
                'link' => '/deliveries',
            ],
            [
                'user_id' => $owner?->id,
                'title' => 'Expiry Warning',
                'message' => 'Omeprazole 20mg (BATCH-OMP-005) expires on 2026-07-30.',
                'type' => 'danger',
                'is_read' => false,
                'link' => '/expiring-soon',
            ],
            [
                'user_id' => $owner?->id,
                'title' => 'Monthly Revenue Report',
                'message' => 'July revenue report is ready. Total revenue: TZS 12,500.',
                'type' => 'success',
                'is_read' => true,
                'link' => '/reports',
            ],
            [
                'user_id' => $pharmacist?->id,
                'title' => 'New Customer Added',
                'message' => 'Carol Banda has been registered as a new customer.',
                'type' => 'info',
                'is_read' => true,
                'link' => '/customers',
            ],
        ];

        foreach ($notifications as $notification) {
            Notification::create([
                'pharmacy_id' => 1,
                'created_at' => now()->subDays(rand(0, 7)),
                ...$notification,
            ]);
        }
    }
}
