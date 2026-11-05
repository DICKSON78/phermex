<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WholesalePricing extends Model
{
    protected $table = 'wholesale_pricing';

    protected $fillable = [
        'drug_id',
        'wholesaler_id',
        'price',
        'minimum_quantity',
        'discount_percentage',
        'status',
        'valid_from',
        'valid_until',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
    ];
}
