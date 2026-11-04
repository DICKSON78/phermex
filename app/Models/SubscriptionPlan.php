<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'duration_months',
        'price',
        'currency',
        'features',
        'is_active',
        'sort_order',
        'grace_period_days',
        'is_monthly',
        'payment_gateway',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'features' => 'array',
        'is_active' => 'boolean',
        'is_monthly' => 'boolean',
        'grace_period_days' => 'integer',
    ];

    public function pharmacies()
    {
        return $this->hasMany(Pharmacy::class);
    }
}
