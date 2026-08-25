<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarketingCampaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'audience',
        'status',
        'start_date',
        'end_date',
        'description',
        'impressions',
        'clicks',
        'conversions',
        'spend',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'impressions' => 'integer',
        'clicks' => 'integer',
        'conversions' => 'integer',
        'spend' => 'decimal:2',
    ];
}
