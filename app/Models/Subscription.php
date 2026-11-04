<?php

namespace App\Models;

use App\Models\Scopes\TenantScoped;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    use TenantScoped, HasFactory;

    protected $fillable = [
        'pharmacy_id',
        'plan',
        'amount',
        'payment_method',
        'transaction_id',
        'status',
        'start_date',
        'end_date',
        'grace_period_until',
        'in_grace_period',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'grace_period_until' => 'datetime',
        'in_grace_period' => 'boolean',
    ];

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    /**
     * Check if subscription is in grace period and extend if needed
     */
    public function checkGracePeriod(): void
    {
        if ($this->end_date < now()->toDate() && !$this->in_grace_period) {
            $plan = $this->pharmacy->subscriptionPlan;
            if ($plan && $plan->grace_period_days > 0) {
                $gracePeriodUntil = $this->end_date->copy()->addDays($plan->grace_period_days);
                $this->update([
                    'in_grace_period' => true,
                    'grace_period_until' => $gracePeriodUntil,
                ]);
            }
        }
    }

    /**
     * Check if subscription has expired (including grace period)
     */
    public function isExpired(): bool
    {
        $checkDate = $this->in_grace_period ? $this->grace_period_until : $this->end_date;
        return $checkDate && $checkDate < now();
    }
}
