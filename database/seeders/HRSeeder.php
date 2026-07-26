<?php

namespace Database\Seeders;

use App\Models\Employee;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HRSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $employees = $this->seedEmployees();
        $this->seedAttendance($employees);
        $this->seedLeaves($employees);
        $this->seedPayroll($employees);
        $this->seedPerformanceReviews($employees);

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    private function seedEmployees(): array
    {
        $employees = [
            [
                'pharmacy_id' => 1,
                'user_id' => 3,
                'employee_number' => 'EMP-001',
                'first_name' => 'Amina',
                'last_name' => 'Juma',
                'email' => 'amina@pharmex.com',
                'phone' => '+255700000002',
                'date_of_birth' => '1990-05-12',
                'gender' => 'female',
                'national_id' => 'TZ-1990-12345-67890',
                'position' => 'Pharmacist',
                'department' => 'pharmacy',
                'employment_type' => 'full_time',
                'hire_date' => '2024-01-15',
                'contract_end_date' => '2026-01-14',
                'basic_salary' => 850000.00,
                'allowances' => 100000.00,
                'tax_id' => 'TIN-01-2345678-A',
                'bank_name' => 'CRDB Bank',
                'bank_account_number' => '0150123456789',
                'emergency_contact_name' => 'Juma Hamisi',
                'emergency_contact_phone' => '+255712000001',
                'status' => 'active',
            ],
            [
                'pharmacy_id' => 1,
                'user_id' => null,
                'employee_number' => 'EMP-002',
                'first_name' => 'Rehema',
                'last_name' => 'Mwangaza',
                'email' => 'rehema@pharmex.com',
                'phone' => '+255712345001',
                'date_of_birth' => '1995-08-20',
                'gender' => 'female',
                'national_id' => 'TZ-1995-23456-78901',
                'position' => 'Cashier',
                'department' => 'operations',
                'employment_type' => 'full_time',
                'hire_date' => '2024-03-01',
                'contract_end_date' => '2026-02-28',
                'basic_salary' => 450000.00,
                'allowances' => 50000.00,
                'tax_id' => 'TIN-02-3456789-B',
                'bank_name' => 'NMB Bank',
                'bank_account_number' => '0280123456789',
                'emergency_contact_name' => 'Mwangaza Abdalla',
                'emergency_contact_phone' => '+255712000002',
                'status' => 'active',
            ],
            [
                'pharmacy_id' => 1,
                'user_id' => null,
                'employee_number' => 'EMP-003',
                'first_name' => 'John',
                'last_name' => 'Komba',
                'email' => 'john@pharmex.com',
                'phone' => '+255712345002',
                'date_of_birth' => '1992-11-03',
                'gender' => 'male',
                'national_id' => 'TZ-1992-34567-89012',
                'position' => 'Delivery Driver',
                'department' => 'operations',
                'employment_type' => 'full_time',
                'hire_date' => '2024-06-15',
                'contract_end_date' => '2026-06-14',
                'basic_salary' => 350000.00,
                'allowances' => 30000.00,
                'tax_id' => 'TIN-03-4567890-C',
                'bank_name' => 'Vodacom M-Pesa',
                'bank_account_number' => '0712345002',
                'emergency_contact_name' => 'Salome Komba',
                'emergency_contact_phone' => '+255712000003',
                'status' => 'active',
            ],
            [
                'pharmacy_id' => 1,
                'user_id' => null,
                'employee_number' => 'EMP-004',
                'first_name' => 'Fatima',
                'last_name' => 'Omari',
                'email' => 'fatima@pharmex.com',
                'phone' => '+255712345003',
                'date_of_birth' => '1988-02-14',
                'gender' => 'female',
                'national_id' => 'TZ-1988-45678-90123',
                'position' => 'Pharmacist',
                'department' => 'pharmacy',
                'employment_type' => 'full_time',
                'hire_date' => '2025-01-10',
                'contract_end_date' => '2027-01-09',
                'basic_salary' => 900000.00,
                'allowances' => 120000.00,
                'tax_id' => 'TIN-04-5678901-D',
                'bank_name' => 'Stanbic Bank',
                'bank_account_number' => '0120123456789',
                'emergency_contact_name' => 'Omari Rashid',
                'emergency_contact_phone' => '+255712000004',
                'status' => 'active',
            ],
            [
                'pharmacy_id' => 1,
                'user_id' => null,
                'employee_number' => 'EMP-005',
                'first_name' => 'Peter',
                'last_name' => 'Mushi',
                'email' => 'peter@pharmex.com',
                'phone' => '+255712345004',
                'date_of_birth' => '1987-07-30',
                'gender' => 'male',
                'national_id' => 'TZ-1987-56789-01234',
                'position' => 'Accountant',
                'department' => 'finance',
                'employment_type' => 'full_time',
                'hire_date' => '2024-09-01',
                'contract_end_date' => '2026-08-31',
                'basic_salary' => 700000.00,
                'allowances' => 80000.00,
                'tax_id' => 'TIN-05-6789012-E',
                'bank_name' => 'Equity Bank',
                'bank_account_number' => '0420123456789',
                'emergency_contact_name' => 'Joyce Mushi',
                'emergency_contact_phone' => '+255712000005',
                'status' => 'active',
            ],
            [
                'pharmacy_id' => 1,
                'user_id' => null,
                'employee_number' => 'EMP-006',
                'first_name' => 'Aisha',
                'last_name' => 'Salim',
                'email' => 'aisha@pharmex.com',
                'phone' => '+255712345005',
                'date_of_birth' => '1996-12-05',
                'gender' => 'female',
                'national_id' => 'TZ-1996-67890-12345',
                'position' => 'Receptionist',
                'department' => 'operations',
                'employment_type' => 'full_time',
                'hire_date' => '2025-03-01',
                'contract_end_date' => '2027-02-28',
                'basic_salary' => 400000.00,
                'allowances' => 40000.00,
                'tax_id' => 'TIN-06-7890123-F',
                'bank_name' => 'Tigo Pesa',
                'bank_account_number' => '0712345005',
                'emergency_contact_name' => 'Salim Hassan',
                'emergency_contact_phone' => '+255712000006',
                'status' => 'active',
            ],
        ];

        $created = [];
        foreach ($employees as $data) {
            $created[] = Employee::create($data);
        }

        return $created;
    }

    private function seedAttendance(array $employees): void
    {
        $weekdays = $this->getWeekdays('2026-07-14', '2026-07-25');

        $lateEmployees = [2, 4];
        $absentEmployees = [3 => '2026-07-16', 5 => '2026-07-22'];
        $overtimeEmployees = [1, 4];

        foreach ($employees as $emp) {
            foreach ($weekdays as $date) {
                $dayOfWeek = date('w', strtotime($date));
                $empIndex = $emp->id;

                $clockInHour = 8;
                $clockInMinute = 0;
                $status = 'present';
                $overtime = 0.0;
                $hoursWorked = 9.0;
                $notes = null;

                if (isset($absentEmployees[$empIndex]) && $absentEmployees[$empIndex] === $date) {
                    $clockInHour = null;
                    $clockInMinute = null;
                    $status = 'absent';
                    $hoursWorked = 0;
                } elseif (in_array($empIndex, $lateEmployees) && $this->isLateDay($empIndex, $date)) {
                    $clockInMinute = rand(15, 30);
                    $status = 'late';
                } elseif (in_array($empIndex, $overtimeEmployees) && $this->isOvertimeDay($empIndex, $date)) {
                    $overtime = round(rand(5, 20) / 10, 1);
                    $hoursWorked = 9.0 + $overtime;
                }

                if ($status === 'absent') {
                    $clockIn = null;
                    $clockOut = null;
                } else {
                    $clockIn = "{$date} {$clockInHour}:" . str_pad($clockInMinute, 2, '0', STR_PAD_LEFT) . ':00';
                    $clockOutTime = 17 + (int) $overtime;
                    $clockOutMinute = $overtime > 0 ? ($overtime - (int) $overtime) * 60 : 0;
                    $clockOut = "{$date} {$clockOutTime}:" . str_pad((int) $clockOutMinute, 2, '0', STR_PAD_LEFT) . ':00';
                }

                DB::table('attendance')->insert([
                    'employee_id' => $empIndex,
                    'date' => $date,
                    'clock_in' => $clockIn,
                    'clock_out' => $clockOut,
                    'status' => $status,
                    'hours_worked' => $hoursWorked,
                    'overtime_hours' => $overtime,
                    'notes' => $notes,
                    'recorded_by' => 2,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function seedLeaves(array $employees): void
    {
        $leaves = [
            [
                'employee_id' => 2,
                'leave_type' => 'annual',
                'start_date' => '2026-07-07',
                'end_date' => '2026-07-11',
                'days_count' => 5,
                'reason' => 'Family trip to Arusha for cultural festival',
                'status' => 'approved',
                'approved_by' => 2,
                'approval_date' => '2026-07-01',
            ],
            [
                'employee_id' => 3,
                'leave_type' => 'sick',
                'start_date' => '2026-07-28',
                'end_date' => '2026-07-30',
                'days_count' => 3,
                'reason' => 'Medical treatment at Muhimbili Hospital for malaria',
                'status' => 'pending',
                'approved_by' => null,
                'approval_date' => null,
            ],
            [
                'employee_id' => 6,
                'leave_type' => 'maternity',
                'start_date' => '2026-08-01',
                'end_date' => '2026-08-31',
                'days_count' => 31,
                'reason' => 'Maternity leave as per company policy',
                'status' => 'approved',
                'approved_by' => 2,
                'approval_date' => '2026-07-15',
            ],
            [
                'employee_id' => 5,
                'leave_type' => 'annual',
                'start_date' => '2026-07-21',
                'end_date' => '2026-07-21',
                'days_count' => 1,
                'reason' => 'Personal errands in Morogoro',
                'status' => 'rejected',
                'approved_by' => 2,
                'approval_date' => null,
                'rejection_reason' => 'Busy month-end closing period. Please reschedule to next month.',
            ],
            [
                'employee_id' => 1,
                'leave_type' => 'sick',
                'start_date' => '2026-06-15',
                'end_date' => '2026-06-16',
                'days_count' => 2,
                'reason' => 'Severe flu and fever, doctor recommended rest',
                'status' => 'approved',
                'approved_by' => 2,
                'approval_date' => '2026-06-15',
            ],
        ];

        foreach ($leaves as $leave) {
            DB::table('leaves')->insert([
                ...$leave,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function seedPayroll(array $employees): void
    {
        $payrollData = [
            1 => ['basic_salary' => 850000.00, 'allowances' => 100000.00, 'overtime_pay' => 45000.00],
            2 => ['basic_salary' => 450000.00, 'allowances' => 50000.00, 'overtime_pay' => 0.00],
            3 => ['basic_salary' => 350000.00, 'allowances' => 30000.00, 'overtime_pay' => 0.00],
            4 => ['basic_salary' => 900000.00, 'allowances' => 120000.00, 'overtime_pay' => 30000.00],
            5 => ['basic_salary' => 700000.00, 'allowances' => 80000.00, 'overtime_pay' => 0.00],
            6 => ['basic_salary' => 400000.00, 'allowances' => 40000.00, 'overtime_pay' => 0.00],
        ];

        $statuses = [
            1 => 'paid',
            2 => 'paid',
            3 => 'paid',
            4 => 'paid',
            5 => 'paid',
            6 => 'pending',
        ];

        foreach ($payrollData as $empId => $data) {
            $grossSalary = $data['basic_salary'] + $data['allowances'] + $data['overtime_pay'];
            $payeTax = $this->calculatePAYE($data['basic_salary'] + $data['overtime_pay']);
            $nssfEmployee = round($data['basic_salary'] * 0.10, 2);
            $nssfEmployer = round($data['basic_salary'] * 0.10, 2);
            $nhif = $this->calculateNHIF($grossSalary);
            $housingLevy = round($grossSalary * 0.03, 2);
            $netSalary = $grossSalary - $payeTax - $nssfEmployee - $nhif - $housingLevy;

            DB::table('payroll')->insert([
                'pharmacy_id' => 1,
                'employee_id' => $empId,
                'period_month' => 7,
                'period_year' => 2026,
                'basic_salary' => $data['basic_salary'],
                'allowances' => $data['allowances'],
                'overtime_pay' => $data['overtime_pay'],
                'gross_salary' => $grossSalary,
                'paye_tax' => $payeTax,
                'nssf_employee' => $nssfEmployee,
                'nssf_employer' => $nssfEmployer,
                'nhif' => $nhif,
                'housing_levy' => $housingLevy,
                'other_deductions' => 0.00,
                'net_salary' => $netSalary,
                'status' => $statuses[$empId],
                'paid_date' => $statuses[$empId] === 'paid' ? '2026-07-28' : null,
                'payment_method' => 'bank',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function seedPerformanceReviews(array $employees): void
    {
        $reviews = [
            [
                'employee_id' => 1,
                'reviewer_id' => 2,
                'review_period_start' => '2026-01-01',
                'review_period_end' => '2026-06-30',
                'rating' => 4.5,
                'goals_met' => 87.50,
                'strengths' => 'Excellent patient counseling skills and consistently accurate dispensing. Maintained zero medication errors for the review period. Strong leadership in training new pharmacy staff.',
                'areas_for_improvement' => 'Could improve inventory forecasting to reduce stock-outs of fast-moving items. Should delegate more routine tasks to support staff.',
                'comments' => 'Dr. Amina is an outstanding pharmacist who consistently exceeds expectations. She has been instrumental in implementing our new dispensing protocols.',
                'status' => 'acknowledged',
            ],
            [
                'employee_id' => 4,
                'reviewer_id' => 1,
                'review_period_start' => '2026-01-01',
                'review_period_end' => '2026-06-30',
                'rating' => 4.0,
                'goals_met' => 80.00,
                'strengths' => 'Deep pharmacological knowledge with strong focus on chronic disease management. Excellent rapport with regular customers. Proactive in identifying drug interactions.',
                'areas_for_improvement' => 'Needs to improve documentation of clinical consultations. Should work on faster turnaround during peak hours.',
                'comments' => 'Fatima has been a valuable addition to the team. Her expertise in chronic disease medications has improved our service quality significantly.',
                'status' => 'submitted',
            ],
            [
                'employee_id' => 5,
                'reviewer_id' => 2,
                'review_period_start' => '2026-01-01',
                'review_period_end' => '2026-06-30',
                'rating' => 3.5,
                'goals_met' => 70.00,
                'strengths' => 'Accurate and timely financial reporting. Good attention to detail in reconciliation. Maintained proper books of accounts throughout the period.',
                'areas_for_improvement' => 'Should develop more comprehensive financial analysis reports. Needs to improve communication with pharmacy staff on budget matters.',
                'comments' => 'Peter handles day-to-day accounting well. Need to see more proactive financial analysis and cost-saving recommendations.',
                'status' => 'draft',
            ],
        ];

        foreach ($reviews as $review) {
            DB::table('performance_reviews')->insert([
                ...$review,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function calculatePAYE(float $taxableIncome): float
    {
        $annualTaxable = $taxableIncome;
        $paye = 0.0;

        if ($annualTaxable <= 270000) {
            $paye = 0;
        } elseif ($annualTaxable <= 520000) {
            $paye = ($annualTaxable - 270000) * 0.08;
        } elseif ($annualTaxable <= 840000) {
            $paye = 20000 + ($annualTaxable - 520000) * 0.20;
        } elseif ($annualTaxable <= 1180000) {
            $paye = 84000 + ($annualTaxable - 840000) * 0.25;
        } else {
            $paye = 169000 + ($annualTaxable - 1180000) * 0.30;
        }

        return round($paye, 2);
    }

    private function calculateNHIF(float $grossSalary): float
    {
        $nhifScale = [
            ['min' => 0, 'max' => 50000, 'deduction' => 500],
            ['min' => 50001, 'max' => 80000, 'deduction' => 800],
            ['min' => 80001, 'max' => 120000, 'deduction' => 1200],
            ['min' => 120001, 'max' => 200000, 'deduction' => 1500],
            ['min' => 200001, 'max' => 300000, 'deduction' => 2000],
            ['min' => 300001, 'max' => 400000, 'deduction' => 2500],
            ['min' => 400001, 'max' => 500000, 'deduction' => 3000],
            ['min' => 500001, 'max' => 600000, 'deduction' => 3500],
            ['min' => 600001, 'max' => 700000, 'deduction' => 4000],
            ['min' => 700001, 'max' => 800000, 'deduction' => 4500],
            ['min' => 800001, 'max' => 900000, 'deduction' => 5000],
            ['min' => 900001, 'max' => 1000000, 'deduction' => 5500],
            ['min' => 1000001, 'max' => PHP_INT_MAX, 'deduction' => 6000],
        ];

        foreach ($nhifScale as $tier) {
            if ($grossSalary >= $tier['min'] && $grossSalary <= $tier['max']) {
                return $tier['deduction'];
            }
        }

        return 6000.00;
    }

    private function getWeekdays(string $startDate, string $endDate): array
    {
        $dates = [];
        $current = new \DateTime($startDate);
        $end = new \DateTime($endDate);

        while ($current <= $end) {
            $dayOfWeek = (int) $current->format('w');
            if ($dayOfWeek >= 1 && $dayOfWeek <= 5) {
                $dates[] = $current->format('Y-m-d');
            }
            $current->modify('+1 day');
        }

        return $dates;
    }

    private function isLateDay(int $empId, string $date): bool
    {
        $latePatterns = [
            2 => ['2026-07-15', '2026-07-23'],
            4 => ['2026-07-18', '2026-07-24'],
        ];

        return isset($latePatterns[$empId]) && in_array($date, $latePatterns[$empId]);
    }

    private function isOvertimeDay(int $empId, string $date): bool
    {
        $overtimePatterns = [
            1 => ['2026-07-14', '2026-07-17', '2026-07-21', '2026-07-25'],
            4 => ['2026-07-16', '2026-07-22'],
        ];

        return isset($overtimePatterns[$empId]) && in_array($date, $overtimePatterns[$empId]);
    }
}
