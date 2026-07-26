<?php

namespace Database\Seeders;

use App\Models\ContentPost;
use App\Models\DrugMovement;
use App\Models\Expense;
use App\Models\RevenueRecord;
use App\Models\SupportTicket;
use App\Models\TicketReply;
use Illuminate\Database\Seeder;

class AdminModuleSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedContentPosts();
        $this->seedSupportTickets();
        $this->seedTicketReplies();
        $this->seedRevenueRecords();
        $this->seedExpenses();
        $this->seedDrugMovements();
    }

    private function seedContentPosts(): void
    {
        $posts = [
            [
                'title' => 'Welcome to Pharmex Platform',
                'type' => 'banner',
                'content' => 'Welcome to Pharmex - your all-in-one pharmacy management platform. Streamline your operations, manage inventory, and grow your pharmacy business with our comprehensive tools and analytics.',
                'image_url' => '/images/banners/welcome-banner.jpg',
                'status' => 'active',
                'starts_at' => now()->subDays(30),
                'ends_at' => now()->addMonths(6),
                'metadata' => ['position' => 'homepage_hero', 'priority' => 1],
                'created_by' => 1,
            ],
            [
                'title' => 'New Feature: Online Ordering Now Available',
                'type' => 'announcement',
                'content' => 'We are excited to announce that online ordering is now live! Customers can now browse your catalog, place orders, and schedule deliveries directly through the Pharmex platform. Enable this feature in your pharmacy settings to start accepting online orders today.',
                'image_url' => '/images/announcements/online-ordering.jpg',
                'status' => 'active',
                'starts_at' => now()->subDays(7),
                'ends_at' => now()->addMonths(3),
                'metadata' => ['feature_slug' => 'online-ordering', 'priority' => 2],
                'created_by' => 1,
            ],
            [
                'title' => 'Monthly Pharmacy Webinar - July 2026',
                'type' => 'promotion',
                'content' => 'Join our monthly pharmacy management webinar on July 30, 2026 at 2:00 PM EAT. This session covers best practices for inventory management, compliance updates, and tips for increasing pharmacy profitability. Register now - spots are limited!',
                'image_url' => '/images/promotions/webinar-july.jpg',
                'status' => 'active',
                'starts_at' => now()->subDays(3),
                'ends_at' => now()->addDays(10),
                'metadata' => ['event_date' => '2026-07-30', 'event_time' => '14:00', 'registration_url' => 'https://pharmex.com/webinars/july-2026'],
                'created_by' => 1,
            ],
            [
                'title' => 'Holiday Operating Hours Update',
                'type' => 'announcement',
                'content' => 'Please note that Pharmex support services will operate on reduced hours during the upcoming holiday period. Emergency support will remain available 24/7. For non-urgent inquiries, please submit a ticket and we will respond within 24 hours.',
                'image_url' => null,
                'status' => 'draft',
                'starts_at' => now()->addDays(14),
                'ends_at' => now()->addDays(21),
                'metadata' => ['holiday' => 'Nane Nane', 'support_hours' => '10:00 - 16:00'],
                'created_by' => 1,
            ],
            [
                'title' => 'Pharmex Partner Pharmacy Program',
                'type' => 'promotion',
                'content' => 'Introducing the Pharmex Partner Pharmacy Program! Earn exclusive benefits including priority support, discounted subscription rates, and co-marketing opportunities. Apply now through your admin dashboard to become a certified Pharmex partner.',
                'image_url' => '/images/promotions/partner-program.jpg',
                'status' => 'draft',
                'starts_at' => null,
                'ends_at' => null,
                'metadata' => ['discount_percentage' => 15, 'min_requirements' => '6 months active subscription'],
                'created_by' => 1,
            ],
        ];

        foreach ($posts as $post) {
            ContentPost::create($post);
        }
    }

    private function seedSupportTickets(): void
    {
        $tickets = [
            [
                'pharmacy_id' => 1,
                'user_id' => 2,
                'subject' => 'Unable to generate monthly sales report',
                'description' => 'When I try to generate the monthly sales report for June 2026, the system shows an error message "Failed to generate report". I have tried multiple times and also tried different date ranges but the issue persists. This is affecting our ability to file monthly tax returns.',
                'priority' => 'high',
                'status' => 'in_progress',
                'category' => 'reporting',
                'assigned_to' => 1,
                'created_at' => now()->subDays(5),
            ],
            [
                'pharmacy_id' => 1,
                'user_id' => 3,
                'subject' => 'Drug inventory count not updating after sale',
                'description' => 'After processing a sale for Amoxicillin 500mg, the inventory count is not automatically reducing. I have to manually update the stock count each time. This started happening after the last system update. Please investigate this bug.',
                'priority' => 'urgent',
                'status' => 'open',
                'category' => 'inventory',
                'assigned_to' => 1,
                'created_at' => now()->subDays(2),
            ],
            [
                'pharmacy_id' => 1,
                'user_id' => 2,
                'subject' => 'Request for wholesale pricing feature',
                'description' => 'We would like to request a feature that allows us to set different pricing tiers for retail and wholesale customers. Currently we can only set one selling price per drug. Having tiered pricing would help us serve our bulk customers better while maintaining retail margins.',
                'priority' => 'low',
                'status' => 'resolved',
                'category' => 'feature_request',
                'assigned_to' => 1,
                'resolved_at' => now()->subDays(1),
                'created_at' => now()->subDays(10),
            ],
            [
                'pharmacy_id' => 1,
                'user_id' => 2,
                'subject' => 'Mobile app crashing on Android devices',
                'description' => 'Several of our staff members are experiencing crashes on the Pharmex mobile app when trying to access the prescription module. The issue occurs on Android 14 devices. iOS seems to work fine. This is disrupting our daily operations.',
                'priority' => 'high',
                'status' => 'open',
                'category' => 'technical',
                'assigned_to' => 1,
                'created_at' => now()->subDays(1),
            ],
        ];

        foreach ($tickets as $ticket) {
            SupportTicket::create($ticket);
        }
    }

    private function seedTicketReplies(): void
    {
        $replies = [
            [
                'ticket_id' => 1,
                'user_id' => 1,
                'message' => 'Thank you for reporting this issue. We have identified the root cause - a database timeout when querying large datasets. Our engineering team is working on a fix and it should be deployed within the next 24 hours. In the meantime, you can try generating a report for a shorter date range.',
                'created_at' => now()->subDays(4),
            ],
            [
                'ticket_id' => 1,
                'user_id' => 2,
                'message' => 'Thank you for the quick response. I tried generating the report for a single week and it worked. Looking forward to the permanent fix.',
                'created_at' => now()->subDays(3),
            ],
            [
                'ticket_id' => 3,
                'user_id' => 1,
                'message' => 'Great suggestion! We have added the tiered pricing feature to our product roadmap. It is currently planned for the Q3 2026 release. We will notify you once it is available. In the meantime, you can use the wholesale_price field in the drug form as a reference.',
                'created_at' => now()->subDays(9),
            ],
        ];

        foreach ($replies as $reply) {
            TicketReply::create($reply);
        }
    }

    private function seedRevenueRecords(): void
    {
        $records = [
            [
                'pharmacy_id' => 1,
                'type' => 'subscription',
                'amount' => 500000.00,
                'description' => 'Pharmex Pro Plan - Annual Subscription',
                'invoice_number' => 'INV-2026-SUB-001',
                'status' => 'paid',
                'due_date' => '2026-01-15',
                'paid_at' => '2026-01-14',
                'payment_method' => 'bank_transfer',
                'notes' => 'Annual subscription payment for Mwalimu Pharmacy',
            ],
            [
                'pharmacy_id' => 1,
                'type' => 'commission',
                'amount' => 87500.00,
                'description' => 'Platform commission on July 2026 orders (5%)',
                'invoice_number' => 'INV-2026-COM-007',
                'status' => 'pending',
                'due_date' => '2026-08-05',
                'paid_at' => null,
                'payment_method' => null,
                'notes' => 'Commission calculated on total sales of TZS 1,750,000',
            ],
            [
                'pharmacy_id' => 1,
                'type' => 'service',
                'amount' => 150000.00,
                'description' => 'Premium listing and featured placement - July 2026',
                'invoice_number' => 'INV-2026-SRV-003',
                'status' => 'paid',
                'due_date' => '2026-07-01',
                'paid_at' => '2026-06-28',
                'payment_method' => 'mobile_money',
                'notes' => 'Featured placement on Pharmex customer app homepage',
            ],
            [
                'pharmacy_id' => 1,
                'type' => 'subscription',
                'amount' => 50000.00,
                'description' => 'Pharmex Pro Plan - Monthly Renewal',
                'invoice_number' => 'INV-2026-SUB-008',
                'status' => 'paid',
                'due_date' => '2026-08-01',
                'paid_at' => '2026-07-30',
                'payment_method' => 'mobile_money',
                'notes' => 'Monthly subscription renewal',
            ],
            [
                'pharmacy_id' => 1,
                'type' => 'commission',
                'amount' => 62000.00,
                'description' => 'Platform commission on June 2026 orders (5%)',
                'invoice_number' => 'INV-2026-COM-006',
                'status' => 'paid',
                'due_date' => '2026-07-05',
                'paid_at' => '2026-07-03',
                'payment_method' => 'bank_transfer',
                'notes' => 'Commission on June sales of TZS 1,240,000',
            ],
            [
                'pharmacy_id' => 1,
                'type' => 'service',
                'amount' => 75000.00,
                'description' => 'SMS notification package - 5000 credits',
                'invoice_number' => 'INV-2026-SRV-004',
                'status' => 'overdue',
                'due_date' => '2026-07-20',
                'paid_at' => null,
                'payment_method' => null,
                'notes' => 'SMS credits for customer order notifications and reminders',
            ],
        ];

        foreach ($records as $record) {
            RevenueRecord::create($record);
        }
    }

    private function seedExpenses(): void
    {
        $expenses = [
            [
                'category' => 'Rent',
                'description' => 'Monthly pharmacy premises rent - July 2026',
                'amount' => 850000.00,
                'date' => '2026-07-01',
                'receipt_number' => 'RCT-RENT-0726',
                'recorded_by' => 2,
                'created_at' => now()->subDays(25),
            ],
            [
                'category' => 'Utilities',
                'description' => 'Electricity bill - TANESCO July 2026',
                'amount' => 185000.00,
                'date' => '2026-07-05',
                'receipt_number' => 'RCT-ELEC-0726',
                'recorded_by' => 2,
                'created_at' => now()->subDays(21),
            ],
            [
                'category' => 'Salaries',
                'description' => 'Staff salaries - July 2026 (pharmacist + 2 assistants)',
                'amount' => 2800000.00,
                'date' => '2026-07-28',
                'receipt_number' => null,
                'recorded_by' => 2,
                'created_at' => now()->subDays(2),
            ],
            [
                'category' => 'Marketing',
                'description' => 'Social media advertising - Facebook & Instagram July 2026',
                'amount' => 350000.00,
                'date' => '2026-07-10',
                'receipt_number' => 'RCT-MKT-0726',
                'recorded_by' => 2,
                'created_at' => now()->subDays(16),
            ],
            [
                'category' => 'Supplies',
                'description' => 'Pharmacy supplies - labels, packaging, dispensing materials',
                'amount' => 95000.00,
                'date' => '2026-07-12',
                'receipt_number' => 'RCT-SUP-0726',
                'recorded_by' => 2,
                'created_at' => now()->subDays(14),
            ],
            [
                'category' => 'Insurance',
                'description' => 'Pharmacy liability insurance - Q3 2026 premium',
                'amount' => 450000.00,
                'date' => '2026-07-01',
                'receipt_number' => 'RCT-INS-0726',
                'recorded_by' => 2,
                'created_at' => now()->subDays(25),
            ],
        ];

        foreach ($expenses as $expense) {
            Expense::create([
                'pharmacy_id' => 1,
                ...$expense,
            ]);
        }
    }

    private function seedDrugMovements(): void
    {
        $movements = [
            [
                'drug_id' => 1,
                'movement_type' => 'purchase',
                'quantity' => 200,
                'unit_cost' => 5.00,
                'reference_number' => 'PO-2026-001',
                'notes' => 'Restock Amoxicillin 500mg from Generic Pharma Ltd',
                'performed_by' => 3,
                'created_at' => now()->subDays(20),
            ],
            [
                'drug_id' => 1,
                'movement_type' => 'sale',
                'quantity' => -50,
                'unit_cost' => 8.50,
                'reference_number' => 'ORD-20260001',
                'notes' => 'Dispensed to Grace Hospital bulk order',
                'performed_by' => 3,
                'created_at' => now()->subDays(14),
            ],
            [
                'drug_id' => 2,
                'movement_type' => 'purchase',
                'quantity' => 500,
                'unit_cost' => 1.50,
                'reference_number' => 'PO-2026-002',
                'notes' => 'Bulk order of Paracetamol 500mg from HealthCare',
                'performed_by' => 3,
                'created_at' => now()->subDays(18),
            ],
            [
                'drug_id' => 3,
                'movement_type' => 'adjustment',
                'quantity' => -5,
                'unit_cost' => 4.00,
                'reference_number' => null,
                'notes' => 'Damaged stock write-off - 5 tablets found broken during stock count',
                'performed_by' => 3,
                'created_at' => now()->subDays(7),
            ],
            [
                'drug_id' => 7,
                'movement_type' => 'purchase',
                'quantity' => 15,
                'unit_cost' => 12.00,
                'reference_number' => 'PO-2026-004',
                'notes' => 'Emergency restock - Salbutamol inhalers running low',
                'performed_by' => 3,
                'created_at' => now()->subDays(10),
            ],
            [
                'drug_id' => 20,
                'movement_type' => 'expiry',
                'quantity' => -8,
                'unit_cost' => 4.50,
                'reference_number' => 'EXP-2026-001',
                'notes' => 'Expired Benzoyl Peroxide 5% batch removed - expiry date 2026-06-30',
                'performed_by' => 3,
                'created_at' => now()->subDays(26),
            ],
        ];

        foreach ($movements as $movement) {
            DrugMovement::create([
                'pharmacy_id' => 1,
                ...$movement,
            ]);
        }
    }
}
