<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ManufacturerCampaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'product_id',
        'name',
        'channel',
        'status',
        'target_audience',
        'description',
        'start_date',
        'end_date',
        'budget',
        'spend',
        'impressions',
        'clicks',
        'conversions',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'budget' => 'decimal:2',
        'spend' => 'decimal:2',
        'impressions' => 'integer',
        'clicks' => 'integer',
        'conversions' => 'integer',
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
