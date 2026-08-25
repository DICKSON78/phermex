<?php

namespace App\Models;

use App\Models\Scopes\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Delivery extends Model
{
    use TenantScoped, HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'order_id',
        'delivery_code',
        'customer_name',
        'customer_phone',
        'delivery_address',
        'delivery_fee',
        'status',
        'assigned_to',
        'estimated_arrival',
        'actual_arrival',
        'picked_up_at',
    ];

    protected $casts = [
        'delivery_fee' => 'decimal:2',
        'estimated_arrival' => 'datetime',
        'actual_arrival' => 'datetime',
    ];

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
