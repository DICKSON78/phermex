<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Pharmacy extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'owner_id',
        'pharmacy_name',
        'pharmacy_logo',
        'cover_image',
        'pharmacy_code',
        'license_number',
        'license_expiry',
        'pharmacy_type',
        'business_category',
        'country',
        'region',
        'district',
        'ward',
        'street',
        'latitude',
        'longitude',
        'phone',
        'email',
        'description',
        'working_days',
        'working_hours',
        'slot_minutes',
        'slot_gap_minutes',
        'loyalty_enabled',
        'loyalty_points_per_tsh',
        'loyalty_redeem_tsh_per_point',
        'opening_capital',
        'currency',
        'monthly_revenue',
        'rating',
        'total_reviews',
        'average_prep_time',
        'total_prescriptions',
        'total_customers',
        'status',
        'is_published',
        'subscription_expires_at',
        'application_status',
        'subscription_plan_id',
        'subscription_amount',
        'payment_status',
        'subscription_start_date',
        'subscription_end_date',
        'trial_ends_at',
        'rejection_reason',
        'customer_payment_method',
        'customer_payment_number',
        'customer_payment_name',
    ];

    protected $casts = [
        'working_days' => 'array',
        'working_hours' => 'array',
        'slot_minutes' => 'integer',
        'slot_gap_minutes' => 'integer',
        'loyalty_enabled' => 'boolean',
        'loyalty_points_per_tsh' => 'decimal:4',
        'loyalty_redeem_tsh_per_point' => 'decimal:2',
        'is_published' => 'boolean',
        'subscription_expires_at' => 'datetime',
        'subscription_start_date' => 'datetime',
        'subscription_end_date' => 'datetime',
        'trial_ends_at' => 'datetime',
        'subscription_amount' => 'decimal:2',
        'opening_capital' => 'decimal:2',
        'monthly_revenue' => 'decimal:2',
        'license_expiry' => 'date',
        'latitude' => 'float',
        'longitude' => 'float',
        'rating' => 'decimal:2',
    ];

    public static function generatePharmacyCode(string $district): string
    {
        $prefix = strtoupper(substr($district, 0, 3));
        do {
            $code = $prefix . '-' . str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
        } while (static::where('pharmacy_code', $code)->exists());

        return $code;
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function drugs(): HasMany
    {
        return $this->hasMany(Drug::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }

    public function pharmacists(): HasMany
    {
        return $this->hasMany(Pharmacist::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(DrugCategory::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function subscriptionPlan()
    {
        return $this->belongsTo(SubscriptionPlan::class);
    }

    public function isActive(): bool
    {
        if ($this->application_status !== 'approved') return false;
        if ($this->trial_ends_at && $this->trial_ends_at->isFuture()) return true;
        if ($this->payment_status === 'paid' && $this->subscription_end_date && $this->subscription_end_date->isFuture()) return true;
        return false;
    }

    /**
     * Approve the pharmacy without waiting for an admin review.
     *
     * Owners used to be parked on "application under review" until somebody
     * clicked Approve, so a fresh sign-up could not use the trial at all. The
     * trial is the review now: the account is usable as soon as it exists and
     * an admin can still reject it afterwards. Only pending rows are touched,
     * so re-running this on every login cannot extend an expired trial.
     */
    public function autoApprove(): bool
    {
        if ($this->application_status !== 'pending') return false;

        return $this->update([
            'application_status' => 'approved',
            'status' => 'active',
            'trial_ends_at' => $this->trial_ends_at ?: now()->addDays(30),
        ]);
    }

    public function hasTrial(): bool
    {
        return $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }

    public function hasSubscription(): bool
    {
        return $this->payment_status === 'paid' && $this->subscription_end_date && $this->subscription_end_date->isFuture();
    }

    public function daysRemaining(): int
    {
        if ($this->hasTrial()) {
            return (int) ceil(now()->diffInDays($this->trial_ends_at, false));
        }
        if ($this->hasSubscription()) {
            return (int) ceil(now()->diffInDays($this->subscription_end_date, false));
        }
        return 0;
    }

    public function subscriptionType(): string
    {
        if ($this->hasTrial()) return 'trial';
        if ($this->hasSubscription()) return 'subscription';
        return 'expired';
    }

    /**
     * Has a package actually been paid for?
     *
     * The checkout writes the package row before the money moves, so a row on
     * its own only means the owner picked a package. The payment is what turns
     * the choice into a package that is in force.
     */
    public function hasPaidPlan(): bool
    {
        if ($this->payment_status !== 'paid') return false;

        // Older rows were paid without an end date being written. They are
        // still paid, so they keep their package.
        if (! $this->subscription_end_date) return true;

        return $this->subscription_end_date->isFuture();
    }

    /**
     * The package whose features this pharmacy may use right now.
     *
     * A paid package always wins. Until the money has arrived, a live trial
     * stands in for one and the owner gets the full feature set (the top
     * package) for the whole trial window — clicking "Pay" must not take
     * features away from an owner whose payment is still pending.
     *
     * When the trial is over and nothing was paid there is no package at all,
     * so the owner is pushed to choose and pay for one.
     */
    public function effectivePlan(): ?string
    {
        // withoutGlobalScopes(): the tenant scope filters by the pharmacies
        // the caller may see, but this row already belongs to this pharmacy.
        $chosen = $this->subscriptions()->withoutGlobalScopes()->latest('id')->value('plan');

        if ($this->hasPaidPlan()) {
            $paid = strtolower($chosen ?: (string) $this->subscriptionPlan?->slug);
            return $paid ?: null;
        }

        if ($this->hasTrial()) return 'trial';

        return null;
    }

    /**
     * The feature matrix that matches the effective plan. A trial unlocks
     * everything, so it shows the top package.
     *
     * @return array<int, array<string, mixed>>
     */
    public function planFeatures(): array
    {
        $plan = $this->effectivePlan();
        if (!$plan) return [];

        $slug = $plan === 'trial' ? 'enterprise' : $plan;

        return SubscriptionPlan::where('slug', $slug)->first()?->features ?? [];
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function accounts(): HasMany
    {
        return $this->hasMany(Account::class);
    }

    public function journalEntries(): HasMany
    {
        return $this->hasMany(JournalEntry::class);
    }

    public function bankAccounts(): HasMany
    {
        return $this->hasMany(BankAccount::class);
    }

    public function budgets(): HasMany
    {
        return $this->hasMany(Budget::class);
    }

    public function taxRecords(): HasMany
    {
        return $this->hasMany(TaxRecord::class);
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function payroll(): HasMany
    {
        return $this->hasMany(Payroll::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'pharmacy_user');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(PharmacyReview::class);
    }
}
