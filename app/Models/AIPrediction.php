<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AIPrediction extends Model
{
    use HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'drug_id',
        'type',
        'prediction_date',
        'predicted_value',
        'confidence_lower',
        'confidence_upper',
        'model_info',
    ];

    protected $casts = [
        'predicted_value' => 'decimal:2',
        'confidence_lower' => 'decimal:2',
        'confidence_upper' => 'decimal:2',
        'model_info' => 'array',
        'prediction_date' => 'date',
    ];

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function drug(): BelongsTo
    {
        return $this->belongsTo(Drug::class);
    }
}