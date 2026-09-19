<?php

namespace App\Models;

use App\Models\Scopes\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientInsurance extends Model
{
    use TenantScoped, HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'customer_user_id',
        'insurance_provider_id',
        'policy_number',
        'group_number',
        'member_id',
        'holder_name',
        'relationship',
        'expiry_date',
        'coverage_percent',
        'is_primary',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'coverage_percent' => 'decimal:2',
        'is_primary' => 'boolean',
    ];

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function customerUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_user_id');
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(InsuranceProvider::class, 'insurance_provider_id');
    }

    public function claims()
    {
        return $this->hasMany(InsuranceClaim::class);
    }
}