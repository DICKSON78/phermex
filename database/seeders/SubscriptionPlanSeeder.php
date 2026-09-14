<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        // Full comparison matrix: starter / professional / enterprise per row.
        $features = [
            ['section' => 'PHARMACY MANAGEMENT', 'rows' => [
                ['name' => 'Pharmacy Management System (PMS)', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Manage Multiple Pharmacies', 's' => 'Up to 3', 'p' => 'Unlimited', 'e' => 'Unlimited'],
                ['name' => 'Pharmacy Profile & Settings', 's' => true, 'p' => true, 'e' => true],
            ]],
            ['section' => 'DRUGS & INVENTORY', 'rows' => [
                ['name' => 'Drug Management', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Categories', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Stock Movement', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Stock Tracking', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Low Stock Alerts', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Expiring Soon Alerts', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Expired Medication Management', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Barcode Scanner', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'AI Inventory Management', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'AI Predictive Market Demand', 's' => false, 'p' => true, 'e' => true],
            ]],
            ['section' => 'SALES & CUSTOMERS', 'rows' => [
                ['name' => 'Orders', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Prescription Management', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Customers', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Customer Messages', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Customer Reviews', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Chatbot', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Loyalty Program', 's' => false, 'p' => true, 'e' => true],
            ]],
            ['section' => 'TELEMEDICINE & HEALTHCARE', 'rows' => [
                ['name' => 'Telemedicine', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Electronic Prescription Service', 's' => false, 'p' => false, 'e' => true],
                ['name' => 'Healthcare Integration', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Clinical Decision Support System', 's' => false, 'p' => false, 'e' => true],
            ]],
            ['section' => 'FINANCE', 'rows' => [
                ['name' => 'Expense Management', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Basic Reporting', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Advanced Reports', 's' => false, 'p' => true, 'e' => true],
            ]],
            ['section' => 'ACCOUNTING', 'rows' => [
                ['name' => 'Chart of Accounts', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Journal Entries', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Bank Management', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Budgets', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Tax Management', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Financial Reports', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Consolidated Financial Reports', 's' => false, 'p' => false, 'e' => true],
            ]],
            ['section' => 'HR & TEAM', 'rows' => [
                ['name' => 'Employees', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Attendance', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Leave Management', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Payroll', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Employee Performance', 's' => false, 'p' => false, 'e' => true],
            ]],
            ['section' => 'DELIVERY', 'rows' => [
                ['name' => 'Patient Home Delivery', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Delivery Management', 's' => false, 'p' => true, 'e' => true],
            ]],
            ['section' => 'SUPPLY CHAIN', 'rows' => [
                ['name' => 'Suppliers', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Supplier Integration', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Purchase Orders', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Goods Received', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Stock Transfer', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Stock Return', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Damaged Goods', 's' => false, 'p' => true, 'e' => true],
            ]],
            ['section' => 'HEALTH INSURANCE', 'rows' => [
                ['name' => 'Health Insurance Integration', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Insurance Management', 's' => false, 'p' => true, 'e' => true],
            ]],
            ['section' => 'COMPLIANCE & REGULATORY', 'rows' => [
                ['name' => 'Controlled Substances', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'License Management', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Drug Recall', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Regulatory Compliance', 's' => false, 'p' => false, 'e' => true],
                ['name' => 'Regulatory Reporting', 's' => false, 'p' => false, 'e' => true],
            ]],
            ['section' => 'AI & MACHINE LEARNING', 'rows' => [
                ['name' => 'AI Inventory Intelligence', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Predictive Medicine Demand', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Disease-Outbreak Prediction', 's' => false, 'p' => false, 'e' => true],
                ['name' => 'Medicine Demand Prediction During Outbreaks', 's' => false, 'p' => false, 'e' => true],
            ]],
            ['section' => 'MOBILE & ACCESS', 'rows' => [
                ['name' => 'Web Application', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Mobile App', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Offline/Online Mobile App', 's' => false, 'p' => true, 'e' => true],
            ]],
            ['section' => 'TOOLS', 'rows' => [
                ['name' => 'Barcode Management', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Data Export', 's' => true, 'p' => true, 'e' => true],
            ]],
            ['section' => 'SUPPORT', 'rows' => [
                ['name' => 'Support Tickets', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Troubleshooting System', 's' => false, 'p' => true, 'e' => true],
                ['name' => 'Standard Support', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Priority Support', 's' => false, 'p' => true, 'e' => true],
                ['name' => '24/7 SUPPORT', 's' => false, 'p' => false, 'e' => true],
                ['name' => 'Dedicated Enterprise Support', 's' => false, 'p' => false, 'e' => true],
            ]],
            ['section' => 'SETTINGS', 'rows' => [
                ['name' => 'Notifications', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'User Profile', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Pharmacy Settings', 's' => true, 'p' => true, 'e' => true],
                ['name' => 'Advanced Settings', 's' => false, 'p' => true, 'e' => true],
            ]],
        ];

        $plans = [
            [
                'name' => 'STARTER',
                'slug' => 'starter',
                'description' => 'Essential tools for small pharmacies. Everything you need to run and grow.',
                'duration_months' => 12,
                'price' => 150,
                'currency' => 'USD',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'PROFESSIONAL',
                'slug' => 'professional',
                'description' => 'For growing pharmacies. Advanced reports, multi-store and mobile access.',
                'duration_months' => 12,
                'price' => 200,
                'currency' => 'USD',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'ENTERPRISE',
                'slug' => 'enterprise',
                'description' => 'Full power for large operations. AI, audits, unlimited stores and 24/7 support.',
                'duration_months' => 12,
                'price' => 250,
                'currency' => 'USD',
                'is_active' => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $plan) {
            $plan['features'] = $features;
            SubscriptionPlan::updateOrCreate(['slug' => $plan['slug']], $plan);
        }

        // Deactivate any legacy plans no longer on sale.
        SubscriptionPlan::where('is_active', true)
            ->whereNotIn('slug', ['starter', 'professional', 'enterprise'])
            ->update(['is_active' => false]);
    }
}