<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TelemedicineSlot extends Model
{
    protected $fillable = [
        'pharmacy_id',
        'slot_date',
        'start_time',
        'end_time',
        'is_available',
    ];

    protected $casts = [
        'slot_date' => 'date',
        'is_available' => 'boolean',
    ];

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function key(): string
    {
        return $this->slot_date->format('Y-m-d') . ' ' . substr($this->start_time, 0, 5);
    }
}