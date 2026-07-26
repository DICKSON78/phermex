<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RegulatorySeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $this->seedPharmacyLicenses();
        $this->seedRegulatoryReports();

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    private function seedPharmacyLicenses(): void
    {
        $now = now();

        $records = [
            [
                'pharmacy_id' => 1,
                'license_type' => 'pharmacy_license',
                'license_number' => 'PHA-TZ-2024-00156',
                'issue_date' => '2024-01-15',
                'expiry_date' => '2027-12-31',
                'issuing_authority' => 'Tanzania Medicines and Medical Devices Authority (TMDA)',
                'document_path' => null,
                'status' => 'active',
                'renewal_reminder_days' => 90,
                'notes' => 'Primary pharmacy practice license issued under the Tanzania Medicines and Medical Devices Authority Act, Cap 200. Authorizes dispensing of prescription and over-the-counter medications.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'license_type' => 'drug_dealer_license',
                'license_number' => 'CDL-TZ-2024-00089',
                'issue_date' => '2024-03-01',
                'expiry_date' => '2027-06-30',
                'issuing_authority' => 'Tanzania Medicines and Medical Devices Authority (TMDA)',
                'document_path' => null,
                'status' => 'active',
                'renewal_reminder_days' => 90,
                'notes' => 'Controlled substances dealer license authorizing storage, handling and dispensing of Category II and III controlled drugs under the Drugs and Cosmetics Act, Cap 92.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('pharmacy_licenses')->insert($records);
    }

    private function seedRegulatoryReports(): void
    {
        $now = now();

        $records = [
            [
                'pharmacy_id' => 1,
                'report_type' => 'monthly_sales',
                'report_period_month' => 6,
                'report_period_year' => 2026,
                'report_data' => json_encode([
                    'total_prescriptions' => 284,
                    'total_otc_sales' => 412,
                    'total_revenue' => 3875000.00,
                    'total_discounts' => 125000.00,
                    'net_revenue' => 3750000.00,
                    'top_selling_categories' => [
                        'antibiotics' => ['units_sold' => 156, 'revenue' => 892500.00],
                        'antihypertensives' => ['units_sold' => 134, 'revenue' => 675000.00],
                        'analgesics' => ['units_sold' => 198, 'revenue' => 562500.00],
                    ],
                    'expired_returns_count' => 4,
                    'expired_returns_value' => 36000.00,
                    'compliance_notes' => 'All prescriptions verified by licensed pharmacist. Cold chain records maintained.',
                ]),
                'status' => 'submitted',
                'submitted_to' => 'Tanzania Medicines and Medical Devices Authority (TMDA)',
                'submitted_at' => '2026-07-05 09:30:00',
                'approved_by' => null,
                'notes' => 'Monthly pharmacy sales report for June 2026 submitted to TMDA as per Regulatory Guidelines for Pharmaceutical Premises.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'report_type' => 'control_substance',
                'report_period_month' => 6,
                'report_period_year' => 2026,
                'report_data' => json_encode([
                    'reporting_quarter' => 'Q2-2026',
                    'controlled_schedule_ii' => [
                        'items' => [],
                        'total_received' => 0,
                        'total_dispensed' => 0,
                        'balance_stock' => 0,
                    ],
                    'controlled_schedule_iii' => [
                        'items' => [
                            ['drug_name' => 'Amoxicillin 500mg', 'received' => 200, 'dispensed' => 135, 'balance' => 65],
                            ['drug_name' => 'Azithromycin 250mg', 'received' => 50, 'dispensed' => 38, 'balance' => 12],
                        ],
                        'total_received' => 250,
                        'total_dispensed' => 173,
                        'balance_stock' => 77,
                    ],
                    'controlled_schedule_iv' => [
                        'items' => [],
                        'total_received' => 0,
                        'total_dispensed' => 0,
                        'balance_stock' => 0,
                    ],
                    'discrepancies' => [],
                    'auditor_name' => 'Rehema Mwangaza',
                    'auditor_designation' => 'Pharmacist In-Charge',
                ]),
                'status' => 'submitted',
                'submitted_to' => 'Tanzania Cooperative Drug Authority (TCDA)',
                'submitted_at' => '2026-07-10 14:00:00',
                'approved_by' => null,
                'notes' => 'Quarterly controlled substances usage and inventory report for Q2 2026 (April-June) submitted to TCDA. No discrepancies found during internal audit.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'report_type' => 'monthly_sales',
                'report_period_month' => 7,
                'report_period_year' => 2026,
                'report_data' => json_encode([
                    'total_prescriptions' => 182,
                    'total_otc_sales' => 267,
                    'total_revenue' => 2450000.00,
                    'total_discounts' => 78000.00,
                    'net_revenue' => 2372000.00,
                    'top_selling_categories' => [
                        'antibiotics' => ['units_sold' => 98, 'revenue' => 560000.00],
                        'analgesics' => ['units_sold' => 124, 'revenue' => 350000.00],
                        'antimalarials' => ['units_sold' => 87, 'revenue' => 290000.00],
                    ],
                    'expired_returns_count' => 2,
                    'expired_returns_value' => 18000.00,
                    'compliance_notes' => 'Monthly data still in progress. Report will be finalized by end of month.',
                ]),
                'status' => 'draft',
                'submitted_to' => null,
                'submitted_at' => null,
                'approved_by' => null,
                'notes' => 'Draft monthly sales report for July 2026. Data is being compiled from POS records. Expected submission to TMDA by 5th August 2026.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('regulatory_reports')->insert($records);
    }
}
