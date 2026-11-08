<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WholesaleInventory extends Model
{
    protected $table = 'wholesale_inventory';

    protected $fillable = [
        'wholesaler_id',
        'drug_id',
        'drug_name',
        'unit',
        'pack_size',
        'category',
        'batch_number',
        'quantity_in_stock',
        'minimum_stock_level',
        'reorder_quantity',
        'unit_price',
        'expiry_date',
        'manufacture_date',
        'location',
        'status',
    ];

    protected $casts = [
        'quantity_in_stock' => 'integer',
        'pack_size' => 'integer',
        'minimum_stock_level' => 'integer',
        'reorder_quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'expiry_date' => 'date',
        'manufacture_date' => 'date',
    ];
}
