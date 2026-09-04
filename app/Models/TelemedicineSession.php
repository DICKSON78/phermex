<?php

namespace App\Models;

use App\Models\Scopes\TenantScoped;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class TelemedicineSession extends Model
{
    use TenantScoped;
    use SoftDeletes;

    protected $fillable = [
        'patient_user_id',
        'pharmacy_id',
        'pharmacist_user_id',
        'room_code',
        'status',
        'scheduled_at',
        'topic',
        'patient_notes',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
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

    public function scopeUpcomingAppointments($q)
    {
        return $q->where('status', 'scheduled')
            ->where('scheduled_at', '>=', now());
    }

    public function scopeForPharmacy($q, int $pharmacyId)
    {
        return $q->where('pharmacy_id', $pharmacyId);
    }
}