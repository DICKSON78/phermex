<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockReturnItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_return_id',
        'drug_id',
        'quantity',
        'unit_cost',
        'batch_number',
        'expiry_date',
        'reason_notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_cost' => 'decimal:2',
        'expiry_date' => 'date',
    ];

    public function stockReturn(): BelongsTo
    {
        return $this->belongsTo(StockReturn::class);
    }

    public function drug(): BelongsTo
    {
        return $this->belongsTo(Drug::class);
    }
}
