<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'pharmacy_id',
        'user_id',
        'employee_number',
        'first_name',
        'last_name',
        'email',
        'phone',
        'date_of_birth',
        'gender',
        'national_id',
        'position',
        'department',
        'employment_type',
        'hire_date',
        'contract_end_date',
        'basic_salary',
        'allowances',
        'tax_id',
        'bank_name',
        'bank_account_number',
        'emergency_contact_name',
        'emergency_contact_phone',
        'status',
        'profile_photo',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'hire_date' => 'date',
        'contract_end_date' => 'date',
        'basic_salary' => 'decimal:2',
        'allowances' => 'decimal:2',
    ];

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function attendance(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function leaves(): HasMany
    {
        return $this->hasMany(Leave::class);
    }

    public function payroll(): HasMany
    {
        return $this->hasMany(Payroll::class);
    }

    public function performanceReviews(): HasMany
    {
        return $this->hasMany(PerformanceReview::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByDepartment($query, $department)
    {
        return $query->where('department', $department);
    }

    public function scopeByEmploymentType($query, $type)
    {
        return $query->where('employment_type', $type);
    }

    public function getFullNameAttribute(): string
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    public static function generateEmployeeNumber(string $pharmacyId): string
    {
        $last = static::where('pharmacy_id', $pharmacyId)
            ->orderByDesc('id')
            ->value('employee_number');

        if ($last && preg_match('/EMP-(\d+)/', $last, $matches)) {
            $next = (int) $matches[1] + 1;
        } else {
            $next = 1;
        }

        return 'EMP-' . str_pad($next, 5, '0', STR_PAD_LEFT);
    }

    public function calculateLeaveBalance(string $leaveType = 'annual'): float
    {
        $totalEntitlement = match ($leaveType) {
            'annual' => 30,
            'sick' => 14,
            'maternity' => 90,
            'paternity' => 10,
            'bereavement' => 5,
            default => 0,
        };

        $daysUsed = $this->leaves()
            ->where('leave_type', $leaveType)
            ->where('status', 'approved')
            ->whereYear('start_date', now()->year)
            ->sum('days_count');

        return max(0, $totalEntitlement - $daysUsed);
    }

    public function getLeaveBalance(): array
    {
        return [
            'annual' => $this->calculateLeaveBalance('annual'),
            'sick' => $this->calculateLeaveBalance('sick'),
            'maternity' => $this->calculateLeaveBalance('maternity'),
            'paternity' => $this->calculateLeaveBalance('paternity'),
            'bereavement' => $this->calculateLeaveBalance('bereavement'),
        ];
    }

    public function getTotalEarnings(float $overtimePay = 0): float
    {
        return $this->basic_salary + $this->allowances + $overtimePay;
    }

    public function getTotalDeductions(array $deductions = []): float
    {
        return array_sum($deductions);
    }
}
