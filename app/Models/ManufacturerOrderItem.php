<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ManufacturerOrderItem extends Model
{
    protected $table = 'manufacturer_order_items';

    protected $fillable = [
        'manufacturer_order_id',
        'manufacturer_product_id',
        'product_name',
        'sku',
        'batch_number',
        'quantity',
        'quantity_received',
        'unit_price',
        'total_price',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'quantity_received' => 'integer',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(ManufacturerOrder::class, 'manufacturer_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(ManufacturerProduct::class, 'manufacturer_product_id');
    }
}
