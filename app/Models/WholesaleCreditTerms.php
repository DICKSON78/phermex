<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WholesaleCreditTerms extends Model
{
    protected $table = 'wholesale_credit_terms';

    protected $fillable = [
        'wholesaler_id',
        'pharmacy_id',
        'credit_limit',
        'current_balance',
        'payment_terms_days',
        'status',
        'last_payment_date',
        'notes',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'payment_terms_days' => 'integer',
        'last_payment_date' => 'datetime',
    ];
}
