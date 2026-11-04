<?php

namespace App\Services;

use App\Models\Pharmacy;
use App\Models\Subscription;
use Illuminate\Support\Facades\Log;

class SubscriptionGracePeriodService
{
    /**
     * Process subscriptions and apply grace period to those expired
     */
    public function processExpiredSubscriptions(): void
    {
        $expiredSubscriptions = Subscription::query()
            ->where('status', 'active')
            ->whereDate('end_date', '<', now()->toDate())
            ->where('in_grace_period', false)
            ->get();

        foreach ($expiredSubscriptions as $subscription) {
            $this->activateGracePeriod($subscription);
        }
    }

    /**
     * Activate grace period for a subscription
     */
    public function activateGracePeriod(Subscription $subscription): bool
    {
        try {
            $plan = $subscription->pharmacy?->subscriptionPlan;

            if (!$plan || $plan->grace_period_days <= 0) {
                return false;
            }

            $gracePeriodUntil = $subscription->end_date->copy()->addDays($plan->grace_period_days);

            $subscription->update([
                'in_grace_period' => true,
                'grace_period_until' => $gracePeriodUntil,
            ]);

            // Notify pharmacy owner about grace period
            $this->notifyGracePeriod($subscription->pharmacy, $gracePeriodUntil);

            Log::info('Grace period activated for subscription', [
                'subscription_id' => $subscription->id,
                'pharmacy_id' => $subscription->pharmacy_id,
                'grace_until' => $gracePeriodUntil,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to activate grace period', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Disable access if grace period has expired
     */
    public function disableExpiredGracePeriods(): void
    {
        $expiredGracePeriods = Pharmacy::query()
            ->whereHas('subscriptions', function ($q) {
                $q->where('in_grace_period', true)
                  ->whereDate('grace_period_until', '<', now()->toDate());
            })
            ->get();

        foreach ($expiredGracePeriods as $pharmacy) {
            $pharmacy->update([
                'status' => 'inactive',
                'is_published' => false,
            ]);

            // Notify pharmacy that grace period ended and subscription needs payment
            $this->notifyGracePeriodEnded($pharmacy);

            Log::info('Pharmacy disabled after grace period expiry', [
                'pharmacy_id' => $pharmacy->id,
            ]);
        }
    }

    /**
     * Send notification about grace period activation
     */
    private function notifyGracePeriod(Pharmacy $pharmacy, $gracePeriodUntil): void
    {
        // TODO: Implement notification service
        // Send email/SMS to pharmacy owner
        Log::info("Grace period notification: Pharmacy {$pharmacy->id} has until {$gracePeriodUntil} to renew subscription");
    }

    /**
     * Send notification about grace period expiry
     */
    private function notifyGracePeriodEnded(Pharmacy $pharmacy): void
    {
        // TODO: Implement notification service
        // Send urgent notification about immediate payment needed
        Log::info("Grace period ended notification: Pharmacy {$pharmacy->id} subscription expired and access disabled");
    }
}
