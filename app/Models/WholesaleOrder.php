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
        'shipment_fee',
        'shipment_method',
        'delivery_address',
        'payment_method',
        'payment_status',
        'account_number',
        'payment_reference',
        'status',
        'ordered_at',
        'expected_delivery_date',
        'confirmed_at',
        'prepared_at',
        'packed_at',
        'dispatched_at',
        'delivered_at',
        'cancelled_at',
        'cancellation_reason',
        'notes',
        'delivery_partner',
        'tracking_number',
    ];

    protected $casts = [
        'items' => 'array',
        'total_amount' => 'decimal:2',
        'shipment_fee' => 'decimal:2',
        'ordered_at' => 'datetime',
        'expected_delivery_date' => 'date',
        'confirmed_at' => 'datetime',
        'prepared_at' => 'datetime',
        'packed_at' => 'datetime',
        'dispatched_at' => 'datetime',
        'delivered_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function eprescription(): BelongsTo
    {
        return $this->belongsTo(EPrescription::class);
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(WholesaleOrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(WholesalePayment::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(WholesaleOrderEvent::class)->orderBy('created_at');
    }

    public function wholesaler(): BelongsTo
    {
        return $this->belongsTo(Wholesaler::class, 'wholesaler_id', 'wholesaler_id');
    }

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class, 'pharmacy_id');
    }
}
