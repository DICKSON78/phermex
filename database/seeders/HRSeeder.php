<?php

namespace Database\Seeders;

use Faker\Factory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HRSeeder extends Seeder
{
    private array $tzBanks = [
        'CRDB Bank Plc',
        'NMB Bank Plc',
        'Stanbic Bank Tanzania',
        'National Bank of Commerce (NBC)',
        'Equity Bank Tanzania',
        'Exim Bank Tanzania',
        'Standard Chartered Bank',
        'Diamond Trust Bank (DTB)',
        'Bank of Africa (BOA)',
        'Ecobank Tanzania',
        'TPB Bank Ltd',
        'Akiba Commercial Bank',
        'DCB Commercial Bank',
        'Hakika Bank',
        'Mwalimu Commercial Bank',
        'NCBA Bank Tanzania',
        'I&M Bank Tanzania',
        'KCB Bank Tanzania',
        'Absa Bank Tanzania',
        'Vodacom M-Pesa',
        'Tigo Pesa',
        'Airtel Money',
        'Halotel Pesa',
        'Azam Pesa',
        'T-Pesa',
    ];

    private array $tzRegions = [
        'Arusha',
        'Dar es Salaam',
        'Dodoma',
        'Geita',
        'Iringa',
        'Kagera',
        'Katavi',
        'Kigoma',
        'Kilimanjaro',
        'Lindi',
        'Manyara',
        'Mara',
        'Mbeya',
        'Morogoro',
        'Mtwara',
        'Mwanza',
        'Njombe',
        'Pwani',
        'Rukwa',
        'Ruvuma',
        'Shinyanga',
        'Simiyu',
        'Singida',
        'Tabora',
        'Tanga',
        'Songwe',
        'Kaskazini A Unguja',
        'Kaskazini B Unguja',
        'Kusini Unguja',
        'Mjini Magharibi',
        'Kaskazini Pemba',
    ];

    private array $tzDistricts = [
        'Arusha DC', 'Arusha MC', 'Meru DC', 'Longido DC', 'Ngorongoro DC',
        'Dar es Salaam Temeke', 'Dar es Salaam Kinondoni', 'Dar es Salaam Ilala',
        'Dodoma MC', 'Dodoma DC', 'Kondoa DC', 'Manyoni DC', 'Mpwapwa DC',
        'Geita DC', 'Geita MC', 'Bukoba DC', 'Bukoba MC', 'Muleba DC',
        'Kigoma DC', 'Kigoma MC', 'Kasulu DC', 'Uvinza DC',
        'Moshi DC', 'Moshi MC', 'Hai DC', 'Rombo DC', 'Siha DC',
        'Lindi DC', 'Lindi MC', 'Nachingwea DC', 'Liwale DC',
        'Babati DC', 'Babati MC', 'Mbulu DC', 'Hanang DC',
        'Musoma DC', 'Musoma MC', 'Bunda DC', 'Serengeti DC',
        'Mbeya DC', 'Mbeya MC', 'Mbarali DC', 'Kyela DC', 'Ileje DC',
        'Morogoro DC', 'Morogoro MC', 'Kilombero DC', 'Mvomero DC', 'Ulanga DC',
        'Mtwara DC', 'Mtwara MC', 'Masasi DC', 'Newala DC', 'Nanyumbu DC',
        'Mwanza DC', 'Mwanza MC', 'Misungwi DC', 'Sengerema DC', 'Nyamagana DC',
        'Njombe DC', 'Njombe MC', 'Makambako TC', 'Wanging\'ombe DC',
        'Bagamoyo DC', 'Kisarawe DC', 'Mkuranga DC', 'Rufiji DC',
        'Sumbawanga DC', 'Sumbawanga MC', 'Kalambo DC', 'Nkasi DC',
        'Songea DC', 'Songea MC', 'Tunduru DC', 'Mbinga DC',
        'Shinyanga DC', 'Shinyanga MC', 'Kahama DC', 'Kahama MC',
        'Bariadi DC', 'Bariadi MC', 'Meatu DC',
        'Singida DC', 'Singida MC', 'Manyoni DC', 'Iramba DC',
        'Tabora DC', 'Tabora MC', 'Nzega DC', 'Igunga DC',
        'Tanga DC', 'Tanga MC', 'Pangani DC', 'Kilindi DC', 'Muheza DC',
        'Songwe DC', 'Momba DC', 'Ileje DC', 'Mbozi DC',
        'Zanzibar City', 'Stone Town', 'Nungwi', 'Paje', 'Jambiani',
        'Chake Chake', 'Wete', 'Mkoani',
    ];

    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $this->seedEmployees();
        $this->seedAttendance();
        $this->seedLeaves();
        $this->seedPayroll();
        $this->seedPerformanceReviews();

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    private function seedEmployees(): void
    {
        $faker = Factory::create();
        $now = now();
        $firstNames = ['Amina','Rehema','John','Fatima','Peter','Aisha','Emmanuel','Grace','Samuel','Rose','David','Monica','Joseph','Agnes','Hassan','Neema','Isack','Beatrice','Daniel','Vincent','Priscilla','Halima','George','Charles','Raphael','Stephen','Frederick','Leah','Sarah','Zainab','Theresa','Dennis','Julius','Henry','Andrew','Flora','Catherine','Moses','Lydia','James','Mercy'];
        $lastNames = ['Juma','Mwangaza','Komba','Omari','Mushi','Salim','Shirima','Kimaro','Mwangi','Ochieng','Nkosi','Safari','Kimbikimbi','Ng\'wandu','Mtembei','Lwakatare','Mahozi','Shighi','Mwakajila','Mwamba','Ntayi','Mkumbwa','Mziray','Olotu','Mushi','Mtelekano','Mtelekano','Mwaipopo','Mwamba','Lwakatare','Mwamba','Tandau','Moyo','Shirima','Mziray','Nkosi','Kibona','Waziri','Mwakasege','Mwang\'ombe','Mweta'];
        $positions = ['Pharmacist','Cashier','Delivery Driver','Accountant','Receptionist','Store Manager','Assistant Pharmacist','Inventory Clerk','Security Guard','Cleaner','IT Support','Marketing Officer','HR Officer','Quality Assurance','Procurement Officer','Branch Manager','Quality Controller','Compliance Officer'];
        $departments = ['pharmacy','operations','logistics','finance','operations','management','pharmacy','operations','security','operations','it','marketing','hr','quality','procurement','management','quality','compliance'];
        $employmentTypes = ['full_time','full_time','full_time','part_time','contract'];
        $statuses = ['active','active','active','active','active','active','active','active','inactive','suspended'];
        $records = [];

        for ($i = 1; $i <= 35; $i++) {
            $fn = $firstNames[($i - 1) % count($firstNames)];
            $ln = $lastNames[($i - 1) % count($lastNames)];
            $posIdx = ($i - 1) % count($positions);
            $region = $this->tzRegions[($i - 1) % count($this->tzRegions)];
            $records[] = [
                'pharmacy_id' => (($i - 1) % 6) + 1,
                'user_id' => $i <= 31 ? $i : null,
                'employee_number' => 'EMP-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'first_name' => $fn,
                'last_name' => $ln,
                'email' => strtolower($fn . '.' . $ln . '@pharmex.com'),
                'phone' => '+255' . $faker->numerify('7## ### ###'),
                'date_of_birth' => $faker->dateTimeBetween('-30 years', '-22 years')->format('Y-m-d'),
                'gender' => $faker->randomElement(['male', 'female']),
                'national_id' => 'TZ-' . $faker->year('Y') . '-' . $faker->numerify('#####') . '-' . $faker->numerify('#####'),
                'position' => $positions[$posIdx],
                'department' => $departments[$posIdx],
                'employment_type' => $faker->randomElement($employmentTypes),
                'hire_date' => $faker->dateTimeBetween('-2 years', '-3 months')->format('Y-m-d'),
                'contract_end_date' => $faker->dateTimeBetween('+6 months', '+2 years')->format('Y-m-d'),
                'basic_salary' => rand(250000, 1200000),
                'allowances' => rand(20000, 150000),
                'tax_id' => 'TIN-' . str_pad($i, 2, '0', STR_PAD_LEFT) . '-' . $faker->numerify('#######') . '-' . chr(65 + ($i % 26)),
                'bank_name' => $faker->randomElement($this->tzBanks),
                'bank_account_number' => $faker->numerify('0############'),
                'emergency_contact_name' => $faker->name,
                'emergency_contact_phone' => '+255' . $faker->numerify('7## ### ###'),
                'status' => $faker->randomElement($statuses),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('employees')->insert($records);
    }

    private function seedAttendance(): void
    {
        $faker = Factory::create();
        $now = now();
        $records = [];
        $empCount = DB::table('employees')->count();
        $statusWeights = ['present','present','present','present','present','present','late','late','absent','leave'];

        for ($empId = 1; $empId <= $empCount; $empId++) {
            $startDate = $now->copy()->subDays(30);
            for ($day = 0; $day < 30; $day++) {
                $date = $startDate->copy()->addDays($day);
                if (in_array($date->dayOfWeek, [0, 6])) continue;
                $status = $faker->randomElement($statusWeights);
                $clockIn = $status === 'absent' ? null : $date->copy()->setTime(rand(7, 9), rand(0, 30))->format('Y-m-d H:i:s');
                $clockOut = ($status === 'absent' || $status === 'leave') ? null : $date->copy()->setTime(rand(16, 18), rand(0, 59))->format('Y-m-d H:i:s');
                $hours = $clockIn && $clockOut ? round((strtotime($clockOut) - strtotime($clockIn)) / 3600, 1) : 0;

                $records[] = [
                    'employee_id' => $empId,
                    'date' => $date->format('Y-m-d'),
                    'clock_in' => $clockIn,
                    'clock_out' => $clockOut,
                    'status' => $status,
                    'hours_worked' => $hours,
                    'overtime_hours' => $status === 'present' && rand(1, 5) === 1 ? round(rand(10, 30) / 10, 1) : 0,
                    'notes' => null,
                    'recorded_by' => 2,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        DB::table('attendance')->insert($records);
    }

    private function seedLeaves(): void
    {
        $faker = Factory::create();
        $now = now();
        $leaveTypes = ['annual','sick','maternity','paternity','unpaid','bereavement','study'];
        $statuses = ['pending','approved','rejected','approved','approved','cancelled'];
        $reasons = [
            'Family medical emergency in Arusha',
            'Annual vacation to Mwanza',
            'Malaria treatment at Muhimbili Hospital',
            'Personal family matters in Dodoma',
            'Maternity leave as per company policy',
            'Medical follow-up appointment at KCMC',
            'Bereavement in family',
            'Relocation assistance to Iringa',
            'Medical procedure requiring recovery',
            'Family traditional ceremony in Kilimanjaro',
            'Attending professional development workshop in Zanzibar',
            'Government official duty in Dodoma',
            'Medical treatment at Bugando Medical Centre',
            'Family emergency in Tanga',
            'Sick leave for tropical disease treatment',
            'Maternity leave — delivery at Amana Hospital',
            'Annual leave to visit Mbeya',
            'Paternity leave for newborn child',
            'Medical follow-up at Temeke Hospital',
            'Family matters in Geita',
            'Attending wedding in Morogoro',
            'Medical treatment in Nairobi, Kenya',
            'Annual vacation — Zanzibar trip',
            'Personal health check-up at Aga Khan',
            'Family gathering in Singida',
            'Emergency dental care at Mwananyamala',
            'Religious pilgrimage preparation',
            'Continuing education at MUHAS',
            'Bereavement — funeral in Mtwara',
            'Medical eye surgery at Eye and Laser Centre',
            'Sick leave — typhoid recovery',
            'Family relocation to Njombe',
            'Compassionate leave — relative hospitalization',
            'Annual leave — travel to Katavi',
            'Government training seminar in Songea',
        ];
        $records = [];

        for ($i = 1; $i <= 35; $i++) {
            $startDate = $faker->dateTimeBetween('-3 months', '+1 month');
            $startCarbon = \Carbon\Carbon::instance($startDate);
            $days = rand(1, 14);
            $endCarbon = $startCarbon->copy()->addDays($days);
            $status = $faker->randomElement($statuses);

            $records[] = [
                'employee_id' => rand(1, DB::table('employees')->count()),
                'leave_type' => $faker->randomElement($leaveTypes),
                'start_date' => $startCarbon->format('Y-m-d'),
                'end_date' => $endCarbon->format('Y-m-d'),
                'days_count' => $days,
                'reason' => $faker->randomElement($reasons),
                'status' => $status,
                'approved_by' => $status === 'approved' ? rand(1, 5) : null,
                'approval_date' => $status === 'approved' ? $startCarbon->copy()->subDays(rand(1, 5))->format('Y-m-d') : null,
                'rejection_reason' => $status === 'rejected' ? $faker->sentence(8) : null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('leaves')->insert($records);
    }

    private function seedPayroll(): void
    {
        $faker = Factory::create();
        $now = now();
        $empCount = DB::table('employees')->count();
        $records = [];

        for ($empId = 1; $empId <= 35; $empId++) {
            if ($empId > $empCount) break;
            $basicSalary = rand(250000, 1200000);
            $allowances = rand(20000, 150000);
            $overtimePay = rand(0, 100000);
            $grossSalary = $basicSalary + $allowances + $overtimePay;
            $payeTax = round($basicSalary * 0.15, 2);
            $nssf = round($basicSalary * 0.10, 2);
            $nhif = round($grossSalary * 0.005, 2);
            $housingLevy = round($grossSalary * 0.03, 2);
            $netSalary = $grossSalary - $payeTax - $nssf - $nhif - $housingLevy;
            $month = rand(1, 6);
            $status = $month <= 4 ? 'paid' : $faker->randomElement(['paid', 'pending', 'approved']);

            $records[] = [
                'pharmacy_id' => (($empId - 1) % 6) + 1,
                'employee_id' => $empId,
                'period_month' => $month,
                'period_year' => 2026,
                'basic_salary' => $basicSalary,
                'allowances' => $allowances,
                'overtime_pay' => $overtimePay,
                'gross_salary' => $grossSalary,
                'paye_tax' => $payeTax,
                'nssf_employee' => $nssf,
                'nssf_employer' => $nssf,
                'nhif' => $nhif,
                'housing_levy' => $housingLevy,
                'other_deductions' => 0,
                'net_salary' => $netSalary,
                'status' => $status,
                'paid_date' => $status === 'paid' ? "2026-" . str_pad($month + 1, 2, '0', STR_PAD_LEFT) . "-28" : null,
                'payment_method' => 'bank',
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('payroll')->insert($records);
    }

    private function seedPerformanceReviews(): void
    {
        $faker = Factory::create();
        $now = now();
        $empCount = DB::table('employees')->count();
        $statuses = ['draft','submitted','acknowledged','acknowledged','submitted'];
        $records = [];

        for ($i = 1; $i <= 35; $i++) {
            $rating = round(rand(20, 50) / 10, 1);
            $status = $faker->randomElement($statuses);

            $records[] = [
                'employee_id' => rand(1, $empCount),
                'reviewer_id' => rand(1, min(10, $empCount)),
                'review_period_start' => '2026-01-01',
                'review_period_end' => '2026-06-30',
                'rating' => $rating,
                'goals_met' => round(rand(50, 100), 2),
                'strengths' => $faker->sentence(12),
                'areas_for_improvement' => $faker->sentence(10),
                'comments' => $faker->sentence(15),
                'status' => $status,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('performance_reviews')->insert($records);
    }
}
