<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'date',
        'clock_in',
        'clock_out',
        'status',
        'hours_worked',
        'overtime_hours',
        'notes',
        'recorded_by',
    ];

    protected $casts = [
        'date' => 'date',
        'clock_in' => 'datetime',
        'clock_out' => 'datetime',
        'hours_worked' => 'decimal:2',
        'overtime_hours' => 'decimal:2',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function clockIn(): void
    {
        $this->update([
            'clock_in' => now(),
            'status' => now()->hour >= 8 ? 'late' : 'present',
        ]);
    }

    public function clockOut(): void
    {
        $this->update(['clock_out' => now()]);
        $this->calculateHours();
    }

    public function calculateHours(): void
    {
        if ($this->clock_in && $this->clock_out) {
            $hours = $this->clock_in->diffInMinutes($this->clock_out) / 60;
            $standardHours = 8;
            $this->update([
                'hours_worked' => round(min($hours, $standardHours + ($this->overtime_hours ?? 0)), 2),
                'overtime_hours' => round(max(0, $hours - $standardHours), 2),
            ]);
        }
    }
}
