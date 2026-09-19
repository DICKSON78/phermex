<?php

namespace App\Models;

use App\Models\Scopes\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InsuranceClaim extends Model
{
    use TenantScoped, HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'patient_insurance_id',
        'order_id',
        'claim_number',
        'total_amount',
        'approved_amount',
        'patient_copay',
        'status',
        'submitted_at',
        'responded_at',
        'notes',
        'pharmacist_notes',
        'processed_by',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'approved_amount' => 'decimal:2',
        'patient_copay' => 'decimal:2',
        'submitted_at' => 'datetime',
        'responded_at' => 'datetime',
    ];

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function patientInsurance(): BelongsTo
    {
        return $this->belongsTo(PatientInsurance::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}