<?php

namespace App\Models;

use App\Models\Scopes\TenantScoped;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class TelemedicineSession extends Model
{
    use TenantScoped;

    protected $fillable = [
        'patient_user_id',
        'pharmacy_id',
        'pharmacist_user_id',
        'room_code',
        'status',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public static function generateRoomCode(): string
    {
        return 'consult-' . strtolower(Str::random(10));
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_user_id');
    }

    public function pharmacist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pharmacist_user_id');
    }

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function scopeActive($q)
    {
        return $q->whereIn('status', ['requested', 'live']);
    }

    public function scopeForPharmacy($q, int $pharmacyId)
    {
        return $q->where('pharmacy_id', $pharmacyId);
    }
}