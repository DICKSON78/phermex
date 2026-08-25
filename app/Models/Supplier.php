<?php

namespace App\Models;

use App\Models\Scopes\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class Supplier extends Model
{
    use TenantScoped, HasFactory, SoftDeletes;

    protected $fillable = [
        'pharmacy_id',
        'name',
        'contact_person',
        'email',
        'phone',
        'address',
        'city',
        'country',
        'tax_id',
        'payment_terms',
        'rating',
        'total_orders',
        'total_purchased',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'rating' => 'decimal:2',
        'total_orders' => 'integer',
        'total_purchased' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function pharmacy()
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function stockReturns(): HasMany
    {
        return $this->hasMany(StockReturn::class);
    }

    public function goodsReceived(): HasMany
    {
        return $this->hasMany(GoodsReceived::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeByRating(Builder $query, string $direction = 'desc'): Builder
    {
        return $query->orderBy('rating', $direction);
    }

    public function getAverageRating(): float
    {
        return (float) $this->rating;
    }

    public function updateOrderStats(): void
    {
        $this->update([
            'total_orders' => $this->purchaseOrders()->count(),
            'total_purchased' => $this->purchaseOrders()->where('status', 'received')->sum('total'),
        ]);
    }
}
