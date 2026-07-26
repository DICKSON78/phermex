<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Budget extends Model
{
    use HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'account_id',
        'budget_year',
        'budget_month',
        'budgeted_amount',
        'actual_amount',
        'variance',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'budget_year' => 'integer',
        'budget_month' => 'integer',
        'budgeted_amount' => 'decimal:2',
        'actual_amount' => 'decimal:2',
        'variance' => 'decimal:2',
    ];

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getVariance(): float
    {
        return (float) $this->actual_amount - (float) $this->budgeted_amount;
    }

    public function getVariancePercentage(): float
    {
        if ((float) $this->budgeted_amount == 0) {
            return 0;
        }
        return round((($this->getVariance()) / (float) $this->budgeted_amount) * 100, 2);
    }
}
