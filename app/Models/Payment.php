<?php

namespace App\Models;

use App\Models\Scopes\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use TenantScoped, HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'revenue_record_id',
        'subscription_id',
        'order_id',
        'gateway',
        'event',
        'status',
        'state',
        'order_reference',
        'payment_reference',
        'transaction_id',
        'channel',
        'amount',
        'collected_amount',
        'fee',
        'currency',
        'phone',
        'customer_name',
        'customer_email',
        'customer_phone',
        'message',
        'payload',
        'gateway_created_at',
        'gateway_updated_at',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'collected_amount' => 'decimal:2',
        'fee' => 'decimal:2',
        'payload' => 'array',
        'gateway_created_at' => 'datetime',
        'gateway_updated_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function revenueRecord(): BelongsTo
    {
        return $this->belongsTo(RevenueRecord::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * The payment the gateway told us about, if we know about it.
     */
    public static function findByReference(?string $reference): ?self
    {
        if (! $reference) {
            return null;
        }

        return static::withoutGlobalScopes()
            ->where('gateway', 'clickpesa')
            ->where('order_reference', $reference)
            ->first();
    }
}
