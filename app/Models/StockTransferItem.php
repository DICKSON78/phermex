<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockTransferItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_transfer_id',
        'drug_id',
        'quantity_sent',
        'quantity_received',
        'batch_number',
        'expiry_date',
        'notes',
    ];

    protected $casts = [
        'quantity_sent' => 'integer',
        'quantity_received' => 'integer',
        'expiry_date' => 'date',
    ];

    public function stockTransfer(): BelongsTo
    {
        return $this->belongsTo(StockTransfer::class);
    }

    public function drug(): BelongsTo
    {
        return $this->belongsTo(Drug::class);
    }
}
