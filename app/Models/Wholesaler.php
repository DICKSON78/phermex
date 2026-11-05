<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wholesaler extends Model
{
    protected $table = 'wholesalers';

    protected $fillable = [
        'wholesaler_id',
        'name',
        'email',
        'phone',
        'address',
        'city',
        'region',
        'country',
        'license_number',
        'registration_number',
        'tax_id',
        'bank_account',
        'bank_name',
        'status',
        'rating',
        'total_orders',
        'on_time_delivery_rate',
        'contact_person',
        'contact_phone',
    ];

    protected $casts = [
        'rating' => 'decimal:2',
        'on_time_delivery_rate' => 'decimal:2',
        'total_orders' => 'integer',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(WholesaleOrder::class, 'wholesaler_id', 'wholesaler_id');
    }

    public function pricing(): HasMany
    {
        return $this->hasMany(WholesalePricing::class, 'wholesaler_id', 'wholesaler_id');
    }

    public function inventory(): HasMany
    {
        return $this->hasMany(WholesaleInventory::class, 'wholesaler_id', 'wholesaler_id');
    }
}
