<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ManufacturerProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'generic_name',
        'category',
        'strength',
        'dosage_form',
        'sku',
        'nafdac_number',
        'barcode',
        'batch_number',
        'description',
        'cost_price',
        'selling_price',
        'wholesale_price',
        'quantity',
        'reorder_level',
        'expiry_date',
        'requires_prescription',
        'status',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'wholesale_price' => 'decimal:2',
        'quantity' => 'integer',
        'reorder_level' => 'integer',
        'expiry_date' => 'date',
        'requires_prescription' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function recalls(): HasMany
    {
        return $this->hasMany(ManufacturerRecall::class, 'product_id');
    }

    public function isLowStock(): bool
    {
        return $this->quantity <= $this->reorder_level;
    }

    public function isExpired(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }
}
