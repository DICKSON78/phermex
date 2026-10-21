<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Payment;
use App\Models\Pharmacy;
use App\Models\RevenueRecord;
use App\Models\Subscription;

/**
 * Turns a paid invoice into a package that is in force.
 *
 * Both the webhook and the page that waits for the payment end up here, so
 * the invoice, the package, the pharmacy and the owner are all told the same
 * thing in the same way, and the owner is only told once.
 */
class SubscriptionActivationService
{
    public function activate(RevenueRecord $revenue, ?Payment $payment = null): void
    {
        // The invoice may already have been paid by the other path. The work
        // still has to be done, because the package and the pharmacy may not
        // have been touched yet, but the owner is not told a second time.
        $alreadyPaid = $revenue->status === 'paid';

        if (! $alreadyPaid) {
            $revenue->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);
        }

        // The package this invoice pays for: the row that carries the
        // reference of the payment, and after that the newest one that is
        // still waiting for its money.
        $subscription = null;

        if ($revenue->payment_reference) {
            $subscription = Subscription::where('pharmacy_id', $revenue->pharmacy_id)
                ->where('transaction_id', $revenue->payment_reference)
                ->latest('id')
                ->first();
        }

        if (! $subscription) {
            $subscription = Subscription::where('pharmacy_id', $revenue->pharmacy_id)
                ->whereIn('status', ['pending', 'active'])
                ->latest('id')
                ->first();
        }

        if ($subscription) {
            $subscription->update([
                'transaction_id' => $revenue->payment_reference ?? $subscription->transaction_id,
                // The channel the money came through, when the gateway told us.
                'payment_method' => $payment?->channel ?: ($subscription->payment_method ?: 'mobile'),
                'status' => 'active',
            ]);
        }

        $pharmacy = Pharmacy::find($revenue->pharmacy_id);

        if ($pharmacy) {
            $pharmacy->update([
                'payment_status' => 'paid',
                'status' => 'active',
                'is_published' => true,
            ]);
        }

        if ($alreadyPaid) {
            return;
        }

        Notification::create([
            'pharmacy_id' => $revenue->pharmacy_id,
            'user_id' => $pharmacy?->owner_id,
            'title' => 'Subscription Payment Received',
            'message' => 'Your subscription payment was received. Your plan is now active.',
            'type' => 'success',
            'is_read' => false,
            'link' => '/dashboard/subscriptions',
        ]);

        if ($pharmacy?->owner_id) {
            app(FcmService::class)->sendToUser(
                (int) $pharmacy->owner_id,
                'Payment confirmed',
                'Your subscription payment was received. Your plan is now active.'
            );
        }
    }
}
