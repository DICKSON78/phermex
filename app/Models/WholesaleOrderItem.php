<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WholesaleOrderItem extends Model
{
    protected $table = 'wholesale_order_items';

    protected $fillable = [
        'wholesale_order_id',
        'drug_id',
        'drug_name',
        'quantity',
        'unit_price',
        'total_price',
        'quantity_received',
        'notes',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(WholesaleOrder::class, 'wholesale_order_id');
    }
}
