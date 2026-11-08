<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ManufacturerOrder extends Model
{
    protected $table = 'manufacturer_orders';

    protected $fillable = [
        'order_id',
        'manufacturer_user_id',
        'wholesaler_id',
        'wholesaler_name',
        'status',
        'payment_method',
        'payment_status',
        'subtotal',
        'shipping_fee',
        'total_amount',
        'delivery_address',
        'notes',
        'expected_delivery_date',
        'confirmed_at',
        'packed_at',
        'dispatched_at',
        'delivered_at',
        'cancelled_at',
        'cancellation_reason',
        'tracking_number',
        'delivery_partner',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'shipping_fee' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'expected_delivery_date' => 'date',
        'confirmed_at' => 'datetime',
        'packed_at' => 'datetime',
        'dispatched_at' => 'datetime',
        'delivered_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function manufacturer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manufacturer_user_id');
    }

    public function wholesaler(): BelongsTo
    {
        return $this->belongsTo(Wholesaler::class, 'wholesaler_id', 'wholesaler_id');
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(ManufacturerOrderItem::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(ManufacturerOrderEvent::class)->orderBy('created_at');
    }
}
