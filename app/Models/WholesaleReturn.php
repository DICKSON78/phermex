<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WholesaleReturn extends Model
{
    protected $table = 'wholesale_returns';

    protected $fillable = [
        'order_id',
        'wholesaler_id',
        'pharmacy_id',
        'wholesale_order_id',
        'returned_items',
        'return_amount',
        'reason',
        'description',
        'status',
        'request_date',
        'approval_date',
        'refund_date',
        'notes',
    ];

    protected $casts = [
        'returned_items' => 'array',
        'return_amount' => 'decimal:2',
        'request_date' => 'datetime',
        'approval_date' => 'datetime',
        'refund_date' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(WholesaleOrder::class, 'wholesale_order_id');
    }
}
