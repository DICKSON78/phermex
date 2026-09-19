<?php

namespace App\Models;

use App\Models\Scopes\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pharmacist extends Model
{
    use TenantScoped, HasFactory;

    protected $fillable = [
        'user_id',
        'pharmacy_id',
        'name',
        'phone',
        'license_number',
        'position',
        'salary',
        'permissions',
        'is_active',
    ];

    protected $casts = [
        'permissions' => 'array',
        'salary' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }
}
