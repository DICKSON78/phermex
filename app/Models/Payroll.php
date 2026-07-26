<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payroll extends Model
{
    use HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'employee_id',
        'period_month',
        'period_year',
        'basic_salary',
        'allowances',
        'overtime_pay',
        'gross_salary',
        'paye_tax',
        'nssf_employee',
        'nssf_employer',
        'nhif',
        'housing_levy',
        'other_deductions',
        'net_salary',
        'status',
        'paid_date',
        'payment_method',
    ];

    protected $casts = [
        'period_month' => 'integer',
        'period_year' => 'integer',
        'basic_salary' => 'decimal:2',
        'allowances' => 'decimal:2',
        'overtime_pay' => 'decimal:2',
        'gross_salary' => 'decimal:2',
        'paye_tax' => 'decimal:2',
        'nssf_employee' => 'decimal:2',
        'nssf_employer' => 'decimal:2',
        'nhif' => 'decimal:2',
        'housing_levy' => 'decimal:2',
        'other_deductions' => 'decimal:2',
        'net_salary' => 'decimal:2',
        'paid_date' => 'date',
    ];

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function calculatePAYE(): float
    {
        $monthlyGross = $this->gross_salary;

        $nssf = $this->calculateNSSF();
        $taxableIncome = max(0, $monthlyGross - $nssf);

        $paye = 0;

        if ($taxableIncome <= 270000) {
            $paye = 0;
        } elseif ($taxableIncome <= 520000) {
            $paye = ($taxableIncome - 270000) * 0.08;
        } elseif ($taxableIncome <= 840000) {
            $paye = 250000 * 0.08 + ($taxableIncome - 520000) * 0.20;
        } elseif ($taxableIncome <= 1640000) {
            $paye = 250000 * 0.08 + 320000 * 0.20 + ($taxableIncome - 840000) * 0.25;
        } elseif ($taxableIncome <= 3240000) {
            $paye = 250000 * 0.08 + 320000 * 0.20 + 800000 * 0.25 + ($taxableIncome - 1640000) * 0.30;
        } else {
            $paye = 250000 * 0.08 + 320000 * 0.20 + 800000 * 0.25 + 1600000 * 0.30 + ($taxableIncome - 3240000) * 0.35;
        }

        $paye -= 300000 / 12;
        $paye = max(0, round($paye, 2));

        return $paye;
    }

    public function calculateNSSF(): float
    {
        return round($this->basic_salary * 0.10, 2);
    }

    public function calculateNHIF(): float
    {
        $gross = $this->gross_salary;

        if ($gross <= 599) return 150;
        if ($gross <= 799) return 300;
        if ($gross <= 1199) return 400;
        if ($gross <= 1499) return 500;
        if ($gross <= 1999) return 600;
        if ($gross <= 2499) return 750;
        if ($gross <= 2999) return 850;
        if ($gross <= 3499) return 900;
        if ($gross <= 3999) return 950;
        if ($gross <= 4499) return 1000;
        if ($gross <= 4999) return 1100;
        if ($gross <= 5999) return 1200;
        if ($gross <= 6999) return 1300;
        if ($gross <= 7999) return 1400;
        if ($gross <= 8999) return 1500;
        if ($gross <= 9999) return 1600;
        return 1700;
    }

    public function calculateHousingLevy(): float
    {
        return round($this->gross_salary * 0.015, 2);
    }

    public static function processPayroll(array $employeeData, int $pharmacyId, int $month, int $year): self
    {
        $nssfEmployee = round($employeeData['basic_salary'] * 0.10, 2);
        $nssfEmployer = round($employeeData['basic_salary'] * 0.10, 2);

        $grossSalary = $employeeData['basic_salary']
            + ($employeeData['allowances'] ?? 0)
            + ($employeeData['overtime_pay'] ?? 0);

        $taxableIncome = max(0, $grossSalary - $nssfEmployee);

        $paye = 0;
        if ($taxableIncome <= 270000) {
            $paye = 0;
        } elseif ($taxableIncome <= 520000) {
            $paye = ($taxableIncome - 270000) * 0.08;
        } elseif ($taxableIncome <= 840000) {
            $paye = 250000 * 0.08 + ($taxableIncome - 520000) * 0.20;
        } elseif ($taxableIncome <= 1640000) {
            $paye = 250000 * 0.08 + 320000 * 0.20 + ($taxableIncome - 840000) * 0.25;
        } elseif ($taxableIncome <= 3240000) {
            $paye = 250000 * 0.08 + 320000 * 0.20 + 800000 * 0.25 + ($taxableIncome - 1640000) * 0.30;
        } else {
            $paye = 250000 * 0.08 + 320000 * 0.20 + 800000 * 0.25 + 1600000 * 0.30 + ($taxableIncome - 3240000) * 0.35;
        }
        $paye -= 300000 / 12;
        $paye = max(0, round($paye, 2));

        $nhif = 0;
        if ($grossSalary <= 599) $nhif = 150;
        elseif ($grossSalary <= 799) $nhif = 300;
        elseif ($grossSalary <= 1199) $nhif = 400;
        elseif ($grossSalary <= 1499) $nhif = 500;
        elseif ($grossSalary <= 1999) $nhif = 600;
        elseif ($grossSalary <= 2499) $nhif = 750;
        elseif ($grossSalary <= 2999) $nhif = 850;
        elseif ($grossSalary <= 3499) $nhif = 900;
        elseif ($grossSalary <= 3999) $nhif = 950;
        elseif ($grossSalary <= 4499) $nhif = 1000;
        elseif ($grossSalary <= 4999) $nhif = 1100;
        elseif ($grossSalary <= 5999) $nhif = 1200;
        elseif ($grossSalary <= 6999) $nhif = 1300;
        elseif ($grossSalary <= 7999) $nhif = 1400;
        elseif ($grossSalary <= 8999) $nhif = 1500;
        elseif ($grossSalary <= 9999) $nhif = 1600;
        else $nhif = 1700;

        $housingLevy = round($grossSalary * 0.015, 2);

        $totalDeductions = $paye + $nssfEmployee + $nhif + $housingLevy + ($employeeData['other_deductions'] ?? 0);
        $netSalary = max(0, round($grossSalary - $totalDeductions, 2));

        return static::create([
            'pharmacy_id' => $pharmacyId,
            'employee_id' => $employeeData['employee_id'],
            'period_month' => $month,
            'period_year' => $year,
            'basic_salary' => $employeeData['basic_salary'],
            'allowances' => $employeeData['allowances'] ?? 0,
            'overtime_pay' => $employeeData['overtime_pay'] ?? 0,
            'gross_salary' => round($grossSalary, 2),
            'paye_tax' => $paye,
            'nssf_employee' => $nssfEmployee,
            'nssf_employer' => $nssfEmployer,
            'nhif' => $nhif,
            'housing_levy' => $housingLevy,
            'other_deductions' => $employeeData['other_deductions'] ?? 0,
            'net_salary' => $netSalary,
            'status' => 'draft',
        ]);
    }
}
