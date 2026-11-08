<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ManufacturerOrderEvent extends Model
{
    protected $table = 'manufacturer_order_events';

    protected $fillable = [
        'manufacturer_order_id',
        'status',
        'title',
        'description',
        'actor_id',
        'actor_name',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(ManufacturerOrder::class, 'manufacturer_order_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
