<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WholesaleOrder extends Model
{
    protected $table = 'wholesale_orders';

    protected $fillable = [
        'order_id',
        'eprescription_id',
        'prescription_id',
        'pharmacy_id',
        'wholesaler_id',
        'items',
        'total_amount',
        'delivery_address',
        'payment_method',
        'status',
        'ordered_at',
        'confirmed_at',
        'dispatched_at',
        'delivered_at',
        'notes',
        'delivery_partner',
        'tracking_number',
    ];

    protected $casts = [
        'items' => 'array',
        'ordered_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'dispatched_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public function eprescription(): BelongsTo
    {
        return $this->belongsTo(EPrescription::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(WholesaleOrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(WholesalePayment::class);
    }
}
