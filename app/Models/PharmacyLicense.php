<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PharmacyLicense extends Model
{
    use HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'license_type',
        'license_number',
        'issue_date',
        'expiry_date',
        'issuing_authority',
        'document_path',
        'status',
        'renewal_reminder_days',
        'notes',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'expiry_date' => 'date',
        'renewal_reminder_days' => 'integer',
    ];

    public function pharmacy()
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function isExpired(): bool
    {
        return $this->expiry_date->isPast();
    }

    public function isExpiringSoon(): bool
    {
        return $this->expiry_date->diffInDays(now()) <= $this->renewal_reminder_days
            && !$this->isExpired();
    }

    public function getDaysUntilExpiry(): int
    {
        return max(0, (int) now()->diffInDays($this->expiry_date, false));
    }

    public function renew(array $data): void
    {
        $this->update([
            'issue_date' => $data['issue_date'],
            'expiry_date' => $data['expiry_date'],
            'license_number' => $data['license_number'] ?? $this->license_number,
            'issuing_authority' => $data['issuing_authority'] ?? $this->issuing_authority,
            'status' => 'active',
        ]);
    }

    public static function getStatuses(): array
    {
        $licenses = self::all();
        $statuses = ['active' => 0, 'expiring' => 0, 'expired' => 0, 'suspended' => 0];

        foreach ($licenses as $license) {
            if ($license->status === 'suspended') {
                $statuses['suspended']++;
            } elseif ($license->isExpired()) {
                $statuses['expired']++;
            } elseif ($license->isExpiringSoon()) {
                $statuses['expiring']++;
            } else {
                $statuses['active']++;
            }
        }

        return $statuses;
    }
}
