<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WholesaleOrderEvent extends Model
{
    protected $table = 'wholesale_order_events';

    protected $fillable = [
        'wholesale_order_id',
        'status',
        'title',
        'description',
        'actor_id',
        'actor_name',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(WholesaleOrder::class, 'wholesale_order_id');
    }
}
