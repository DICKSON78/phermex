<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformanceReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'reviewer_id',
        'review_period_start',
        'review_period_end',
        'rating',
        'goals_met',
        'strengths',
        'areas_for_improvement',
        'comments',
        'status',
    ];

    protected $casts = [
        'review_period_start' => 'date',
        'review_period_end' => 'date',
        'rating' => 'decimal:1',
        'goals_met' => 'decimal:2',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function getRatingLabelAttribute(): string
    {
        return match (true) {
            $this->rating >= 4.5 => 'Excellent',
            $this->rating >= 3.5 => 'Good',
            $this->rating >= 2.5 => 'Average',
            $this->rating >= 1.5 => 'Below Average',
            default => 'Poor',
        };
    }
}
