<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ManufacturerIntegration extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'provider',
        'name',
        'type',
        'endpoint',
        'api_key',
        'status',
        'description',
        'last_synced_at',
    ];

    protected $casts = [
        'last_synced_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
