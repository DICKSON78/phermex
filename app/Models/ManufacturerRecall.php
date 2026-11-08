<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ManufacturerRecall extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'product_id',
        'recall_number',
        'product_name',
        'recall_reason',
        'severity',
        'batch_numbers',
        'date_issued',
        'date_resolved',
        'affected_quantity',
        'returned_quantity',
        'status',
        'notes',
    ];

    protected $casts = [
        'date_issued' => 'date',
        'date_resolved' => 'date',
        'affected_quantity' => 'integer',
        'returned_quantity' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(ManufacturerProduct::class, 'product_id');
    }
}
