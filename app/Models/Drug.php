<?php

namespace App\Models;

use App\Models\Scopes\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Drug extends Model
{
    use TenantScoped, HasFactory, SoftDeletes;

    protected $fillable = [
        'pharmacy_id',
        'category_id',
        'name',
        'generic_name',
        'slug',
        'description',
        'manufacturer',
        'nafdac_number',
        'barcode',
        'buying_price',
        'selling_price',
        'wholesale_price',
        'quantity',
        'unit',
        'reorder_level',
        'expiry_date',
        'batch_number',
        'requires_prescription',
        'is_generic',
        'is_published',
        'image_url',
    ];

    protected $casts = [
        'buying_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'wholesale_price' => 'decimal:2',
        'expiry_date' => 'date',
        'requires_prescription' => 'boolean',
        'is_generic' => 'boolean',
        'is_published' => 'boolean',
        'quantity' => 'integer',
        'reorder_level' => 'integer',
    ];

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(DrugCategory::class, 'category_id');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(DrugMovement::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function prescriptionItems(): HasMany
    {
        return $this->hasMany(PrescriptionItem::class);
    }

    public function isExpired(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }

    public function isLowStock(): bool
    {
        return $this->quantity <= $this->reorder_level;
    }

    public function profitMargin(): float
    {
        if ($this->buying_price <= 0) {
            return 0;
        }

        return (($this->selling_price - $this->buying_price) / $this->buying_price) * 100;
    }
}
