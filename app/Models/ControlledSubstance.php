<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class ControlledSubstance extends Model
{
    use HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'drug_id',
        'schedule',
        'register_number',
        'date_received',
        'quantity_received',
        'balance_stock',
        'issued_to',
        'quantity_issued',
        'issue_date',
        'issuing_pharmacist_id',
        'receiving_person_name',
        'receiving_person_id_number',
        'witness_name',
        'witness_id_number',
        'notes',
    ];

    protected $casts = [
        'date_received' => 'date',
        'issue_date' => 'date',
        'quantity_received' => 'integer',
        'balance_stock' => 'integer',
        'quantity_issued' => 'integer',
    ];

    public function pharmacy()
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function drug(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Drug::class);
    }

    public function issuingPharmacist(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'issuing_pharmacist_id');
    }

    public function scopeBySchedule(Builder $query, string $schedule): Builder
    {
        return $query->where('schedule', $schedule);
    }

    public function issue(array $data): void
    {
        $this->update([
            'issued_to' => $data['issued_to'],
            'quantity_issued' => $data['quantity_issued'],
            'issue_date' => $data['issue_date'] ?? now()->toDateString(),
            'issuing_pharmacist_id' => $data['issuing_pharmacist_id'],
            'receiving_person_name' => $data['receiving_person_name'] ?? null,
            'receiving_person_id_number' => $data['receiving_person_id_number'] ?? null,
            'witness_name' => $data['witness_name'] ?? null,
            'witness_id_number' => $data['witness_id_number'] ?? null,
            'balance_stock' => $this->balance_stock - $data['quantity_issued'],
        ]);
    }

    public function getBalance(): int
    {
        return $this->balance_stock;
    }

    public function getAuditTrail(): array
    {
        return [
            'register_number' => $this->register_number,
            'drug' => $this->drug->name ?? 'N/A',
            'schedule' => $this->schedule,
            'date_received' => $this->date_received->format('d/m/Y'),
            'quantity_received' => $this->quantity_received,
            'balance' => $this->balance_stock,
            'issued_to' => $this->issued_to,
            'quantity_issued' => $this->quantity_issued,
            'issue_date' => $this->issue_date?->format('d/m/Y'),
            'pharmacist' => $this->issuingPharmacist->name ?? 'N/A',
            'witness' => $this->witness_name,
        ];
    }

    public static function generateRegisterNumber(int $pharmacyId, string $schedule): string
    {
        $prefix = match ($schedule) {
            'schedule_i' => 'CS-I',
            'schedule_ii' => 'CS-II',
            'schedule_iii' => 'CS-III',
            default => 'CS',
        };

        $latest = self::where('pharmacy_id', $pharmacyId)
            ->where('schedule', $schedule)
            ->orderByDesc('id')
            ->value('register_number');

        if ($latest) {
            $num = (int) str_replace($prefix . '-', '', $latest) + 1;
        } else {
            $num = 1;
        }

        return $prefix . '-' . str_pad($num, 5, '0', STR_PAD_LEFT);
    }
}
