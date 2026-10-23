<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy;
use App\Models\Payment;
use App\Models\RevenueRecord;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Services\ClickPesaPaymentService;
use App\Services\ClickPesaService;
use App\Services\ExchangeRateService;
use App\Services\SubscriptionActivationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SubscriptionController extends Controller
{
    /**
     * Live USD -> TZS rate, so the customer sees the shillings they will
     * actually be charged at the rate of the day.
     */
    public function exchangeRate(ExchangeRateService $rates): JsonResponse
    {
        return response()->json($rates->quote());
    }

    public function plans(): JsonResponse
    {
        $plans = SubscriptionPlan::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $plans]);
    }

    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $pharmacyId = $user->resolveCurrentPharmacyId();
        $pharmacy = $pharmacyId ? Pharmacy::find($pharmacyId) : null;

        if (!$pharmacy) {
            return response()->json([
                'has_pharmacy' => false,
            ]);
        }

        // A pending row is a leftover from the manual approval flow. Approve it
        // here as well so an owner who is already signed in (or still holding
        // an old token) is not stuck on the "under review" screen.
        if ($pharmacy->application_status === 'pending') {
            $pharmacy->autoApprove();
            $pharmacy->refresh();
        }

        // The package in force: the one the owner chose, or the trial (which
        // carries the full feature set) while no package has been chosen.
        $effectivePlan = $pharmacy->effectivePlan();
        $onTrial = $effectivePlan === 'trial';

        return response()->json([
            'has_pharmacy' => true,
            'application_status' => $pharmacy->application_status,
            'subscription_type' => $pharmacy->subscriptionType(),
            'plan' => $effectivePlan,
            'plan_name' => $effectivePlan
                ? ($onTrial ? 'Trial' : ucfirst(str_replace('-', ' ', $effectivePlan)))
                : null,
            'plan_access' => $onTrial ? 'full' : $effectivePlan,
            'plan_features' => $pharmacy->planFeatures(),
            'days_remaining' => $pharmacy->daysRemaining(),
            'trial_ends_at' => $pharmacy->trial_ends_at?->toISOString(),
            'subscription_end_date' => $pharmacy->subscription_end_date?->toISOString(),
            'payment_status' => $pharmacy->payment_status,
            'payment_failure_reason' => $this->paymentFailureReason($pharmacy),
            'rejection_reason' => $pharmacy->rejection_reason,
            'pharmacy_name' => $pharmacy->pharmacy_name,
            'payment_history' => $this->paymentHistory($pharmacy),
        ]);
    }

    /**
     * The reason the gateway gave when the last payment did not go through.
     *
     * "Transaction timed out" or "Insufficient balance" tells the owner what
     * to fix, which a plain "failed" does not.
     */
    private function paymentFailureReason(Pharmacy $pharmacy): ?string
    {
        $payment = Payment::withoutGlobalScopes()
            ->where('pharmacy_id', $pharmacy->id)
            ->where('state', ClickPesaPaymentService::STATE_FAILED)
            ->orderByDesc('id')
            ->first();

        return $payment?->message;
    }

    /**
     * The invoice history of this pharmacy, newest first.
     *
     * The status comes from the revenue records, which are the invoices: a
     * package that was chosen but not paid for is pending, not active. The
     * revenue record also carries the amount that was actually charged, in
     * TZS, next to the price of the package in USD. The payments are what the
     * gateway said about each of them: the channel the money came through,
     * the amount it collected and the reason when there was one.
     */
    private function paymentHistory(Pharmacy $pharmacy): array
    {
        $subscriptions = $pharmacy->subscriptions()
            ->withoutGlobalScopes()
            ->orderByDesc('id')
            ->limit(20)
            ->get(['id', 'plan', 'amount', 'status', 'transaction_id', 'start_date', 'end_date']);

        $invoices = RevenueRecord::withoutGlobalScopes()
            ->where('pharmacy_id', $pharmacy->id)
            ->where('type', 'subscription')
            ->orderByDesc('id')
            ->limit(20)
            ->get(['payment_reference', 'amount', 'status', 'paid_at']);

        $payments = Payment::withoutGlobalScopes()
            ->where('pharmacy_id', $pharmacy->id)
            ->orderByDesc('id')
            ->limit(20)
            ->get();

        return $subscriptions->map(function ($sub) use ($invoices, $payments) {
            // The invoice that belongs to this package: the one carrying its
            // reference, or the newest one when the reference is still empty
            // because the payment has not been confirmed yet.
            $invoice = $invoices->firstWhere('payment_reference', $sub->transaction_id)
                ?: ($sub->transaction_id ? null : $invoices->first());

            $payment = $payments->firstWhere('order_reference', $sub->transaction_id)
                ?: ($sub->transaction_id ? null : $payments->first());

            return [
                'plan' => $sub->plan,
                'amount' => (float) $sub->amount,
                'amount_tzs' => $invoice ? (float) $invoice->amount : null,
                'status' => $invoice?->status ?? $sub->status,
                'payment_status' => $invoice?->status ?? $sub->status,
                'reference' => $sub->transaction_id,
                'start_date' => $sub->start_date?->toISOString(),
                'end_date' => $sub->end_date?->toISOString(),
                'paid_at' => $invoice?->paid_at?->toISOString(),
                // What the gateway reported about this payment.
                'channel' => $payment?->channel,
                'gateway_status' => $payment?->status,
                'gateway_state' => $payment?->state,
                'collected_amount' => $payment?->collected_amount !== null ? (float) $payment->collected_amount : null,
                'fee' => $payment?->fee !== null ? (float) $payment->fee : null,
                'payment_reference' => $payment?->payment_reference,
                'gateway_transaction_id' => $payment?->transaction_id,
                'gateway_message' => $payment?->message,
                'phone' => $payment?->phone,
            ];
        })->values()->all();
    }

    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
        ]);

        $user = $request->user();
        $pharmacyId = $user->resolveCurrentPharmacyId();
        $pharmacy = $pharmacyId ? Pharmacy::find($pharmacyId) : null;

        if (!$pharmacy) {
            return response()->json(['message' => 'No pharmacy found.'], 404);
        }

        if ($pharmacy->application_status !== 'approved') {
            return response()->json(['message' => 'Your application has not been approved yet.'], 403);
        }

        $plan = SubscriptionPlan::findOrFail($validated['plan_id']);

        $startDate = now();
        $endDate = $startDate->copy()->addMonths($plan->duration_months);

        $planSlug = $this->planSlug($plan);

        // The invoice is in shillings, which is what the customer is charged.
        // The price of the plan in dollars is kept on the package itself.
        $exchangeRates = app(ExchangeRateService::class);
        $amountTzs = round((float) $plan->price * $exchangeRates->tzsPerUsd());

        Subscription::create([
            'pharmacy_id' => $pharmacy->id,
            'plan' => $planSlug,
            'amount' => $plan->price,
            // Chosen, not yet paid for. The money turns it active.
            'status' => 'pending',
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);

        RevenueRecord::create([
            'pharmacy_id' => $pharmacy->id,
            'pharmacy_name' => $pharmacy->pharmacy_name,
            'type' => 'subscription',
            'amount' => $amountTzs,
            'description' => 'Subscription: ' . $plan->name,
            'invoice_number' => RevenueRecord::generateInvoiceNumber(),
            'status' => 'pending',
            'due_date' => $startDate->copy()->addDays(7),
            'payment_method' => $validated['payment_method'] ?? 'mobile',
        ]);

        $pharmacy->update([
            'subscription_plan_id' => $plan->id,
            'subscription_amount' => $amountTzs,
            'payment_status' => 'pending',
            'subscription_start_date' => $startDate,
            'subscription_end_date' => $endDate,
        ]);

        return response()->json([
            'message' => 'Subscription plan selected. Please complete payment.',
            'subscription' => [
                'plan' => $plan,
                'amount' => $plan->price,
                'start_date' => $startDate->toISOString(),
                'end_date' => $endDate->toISOString(),
                'payment_status' => 'pending',
            ],
        ]);
    }

    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
            'phone' => 'required|string|max:20',
            'payment_method' => 'sometimes|string|max:50',
        ]);

        $user = $request->user();
        $pharmacyId = $user->resolveCurrentPharmacyId();
        $pharmacy = $pharmacyId ? Pharmacy::find($pharmacyId) : null;

        if (!$pharmacy) {
            return response()->json(['message' => 'No pharmacy found.'], 404);
        }

        if ($pharmacy->application_status !== 'approved') {
            return response()->json(['message' => 'Your application has not been approved yet.'], 403);
        }

        // Rejected before anything is written, so a Vodacom customer who cannot
        // pay yet does not leave a pending invoice behind on every retry.
        if (ClickPesaService::isMpesaNumber($validated['phone'])) {
            return response()->json([
                'message' => 'M-PESA payments are not available yet. Please pay with Tigo Pesa, Airtel Money or HaloPesa.',
                'coming_soon' => true,
                'supported_channels' => ['TIGO-PESA', 'AIRTEL-MONEY', 'HALOPESA'],
            ], 422);
        }

        $plan = SubscriptionPlan::findOrFail($validated['plan_id']);
        // Price the plan with the USD->TZS rate of the day, not a fixed constant.
        $exchangeRates = app(ExchangeRateService::class);
        $rate = $exchangeRates->tzsPerUsd();
        $amountTzs = round((float) $plan->price * $rate);

        $startDate = now();
        $endDate = $startDate->copy()->addMonths($plan->duration_months);

        // If a record already exists for this plan, re-use it so the checkout
        // is idempotent (no duplicated invoices on retry). A package that is
        // still waiting for its money keeps saying so, and one that has been
        // paid for stays active.
        $subscription = Subscription::where('pharmacy_id', $pharmacy->id)
            ->where('plan', $this->planSlug($plan))
            ->whereIn('status', ['pending', 'active'])
            ->latest('id')
            ->first();

        if (!$subscription || !$subscription->start_date->isToday()) {
            $subscription = Subscription::create([
                'pharmacy_id' => $pharmacy->id,
                'plan' => $this->planSlug($plan),
                'amount' => $plan->price,
                // Chosen, not yet paid for. The money turns it active.
                'status' => 'pending',
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]);
        }

        $revenue = RevenueRecord::where('pharmacy_id', $pharmacy->id)
            ->where('type', 'subscription')
            ->where('status', 'pending')
            ->latest('id')
            ->first();

        if (!$revenue || !$revenue->created_at->isToday()) {
            $revenue = RevenueRecord::create([
                'pharmacy_id' => $pharmacy->id,
                'pharmacy_name' => $pharmacy->pharmacy_name,
                'type' => 'subscription',
                'amount' => $amountTzs,
                'description' => 'Subscription: ' . $plan->name,
                'invoice_number' => RevenueRecord::generateInvoiceNumber(),
                'status' => 'pending',
                'due_date' => $startDate->copy()->addDays(7),
                'payment_method' => $validated['payment_method'] ?? 'mobile',
            ]);
        }

        $pharmacy->update([
            'subscription_plan_id' => $plan->id,
            'subscription_amount' => $amountTzs,
            'payment_status' => 'pending',
            'subscription_start_date' => $startDate,
            'subscription_end_date' => $endDate,
        ]);

        $service = app(ClickPesaService::class);
        $pushInitiated = false;
        $reference = null;
        $pushChannel = null;
        $pushStatus = null;
        $pushError = null;
        $supportedChannels = [];

        if ($service->enabled()) {
            try {
                $pushRef = ClickPesaService::reference('HELIXSUB', $subscription->id);

                // Ask the gateway what it can charge for this amount first. If it
                // cannot charge this network, or the amount is outside its
                // limits, say so now instead of pushing and leaving the customer
                // waiting on a prompt that will never arrive.
                $preview = null;

                try {
                    $preview = $service->previewPush((string) $amountTzs, $validated['phone'], $pushRef);
                } catch (\Throwable $previewFailure) {
                    // A preview problem is not a reason to refuse payment. Fall
                    // through and let the push itself be the answer.
                    Log::info('ClickPesa preview unavailable, attempting push anyway: ' . $previewFailure->getMessage());
                }

                // Checked outside the try above on purpose: an empty result is a
                // definite "this cannot be charged", not an inconclusive preview,
                // so it must not be absorbed by that catch and fall through.
                if ($preview !== null) {
                    $supportedChannels = $preview['available'];

                    if (!$supportedChannels) {
                        $reason = $preview['unavailable'][0]['message'] ?? 'no mobile money method is available';

                        throw new \Exception('ClickPesa cannot take this payment yet: ' . $reason);
                    }
                }

                $push = $service->initiatePush((string) $amountTzs, $validated['phone'], $pushRef);
                $reference = $push['orderReference'] ?? $pushRef;
                $pushChannel = $push['channel'] ?? null;
                $pushStatus = strtoupper((string) ($push['status'] ?? ''));

                // The gateway answers 200 with status FAILED when it refuses the
                // request, so an HTTP success alone is not a push that was sent.
                // Reporting those as delivered left the owner staring at "check
                // your phone" for a prompt that was never going to arrive.
                if (in_array($pushStatus, ['FAILED', 'REJECTED', 'EXPIRED'], true)) {
                    throw new \Exception('ClickPesa refused the payment request (' . ($pushStatus ?: 'no reason given') . ').');
                }

                $pushInitiated = true;

                $subscription->update([
                    'transaction_id' => $reference,
                    'payment_method' => 'mobile',
                ]);

                $revenue->update([
                    'payment_reference' => $reference,
                    'payment_method' => 'mobile',
                ]);

                // What the gateway said about this payment is written down
                // straight away: the reference, the channel the prompt went
                // through and the amount it will collect. The customer has not
                // answered yet, so it is recorded as still in progress.
                $fee = null;

                foreach ($supportedChannels as $method) {
                    if (strcasecmp((string) ($method['name'] ?? ''), (string) $pushChannel) === 0) {
                        $fee = $method['fee'] ?? null;

                        break;
                    }
                }

                app(ClickPesaPaymentService::class)->record($push, [
                    'pharmacy_id' => $pharmacy->id,
                    'revenue_record_id' => $revenue->id,
                    'subscription_id' => $subscription->id,
                    'amount' => $amountTzs,
                    'fee' => $fee,
                    'phone' => ClickPesaService::normalizePhone($validated['phone']),
                    'order_reference' => $reference,
                ]);
            } catch (\Throwable $e) {
                // Log for us, but also hand the reason to the owner. A push that
                // never left was previously reported as "reserved, complete
                // payment to activate", which reads like a payment problem and
                // leaves them waiting on a prompt that was never sent.
                Log::warning('Subscription ClickPesa push init failed: ' . $e->getMessage());
                $pushError = $e->getMessage();
            }
        } else {
            $pushError = 'The payment gateway is not configured on this server.';
        }

        return response()->json([
            'message' => $pushInitiated
                ? 'Payment prompt sent to your phone. Confirm the payment prompt to activate your plan.'
                : 'Subscription reserved. Complete payment to activate.',
            'push_initiated' => $pushInitiated,
            // Only ever present when push_initiated is false. The checkout screen
            // shows it instead of a generic instruction to pay, because the two
            // situations need different things from the customer.
            'push_error' => $pushError,
            // The networks this merchant account can actually charge. A Vodacom
            // customer needs to hear "M-PESA is not enabled" rather than be
            // told to approve a prompt on a network that will never send one.
            'supported_channels' => array_column($supportedChannels, 'name'),
            'gateway_channel' => $pushChannel,
            'gateway_status' => $pushStatus,
            'reference' => $reference,
            'subscription' => [
                'id' => $subscription->id,
                'plan' => $plan,
                'amount_usd' => (float) $plan->price,
                'amount_tzs' => $amountTzs,
                'currency' => 'TZS',
                'exchange_rate' => $rate,
                'exchange_rate_date' => $exchangeRates->quote()['date'],
                'phone' => $validated['phone'],
                'start_date' => $startDate->toISOString(),
                'end_date' => $endDate->toISOString(),
                'payment_status' => 'pending',
            ],
        ]);
    }

    public function paymentStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reference' => 'required|string|max:255',
        ]);

        $revenue = RevenueRecord::where('payment_reference', $validated['reference'])
            ->where('type', 'subscription')
            ->first();

        if (!$revenue) {
            return response()->json(['message' => 'Subscription payment not found.'], 404);
        }

        $service = app(ClickPesaService::class);
        if (!$service->enabled()) {
            return response()->json([
                'message' => 'Payment gateway not configured.',
                'status' => 'pending',
            ], 503);
        }

        try {
            $status = $service->queryStatus($validated['reference']);
        } catch (\Throwable $e) {
            // A gateway that has spent its daily allowance will refuse the next
            // call too, and the one after that. Saying so stops the page asking
            // again and again, which would only spend what is left discovering
            // the same refusal. The payment itself is untouched.
            if (str_contains($e->getMessage(), 'Daily API limit')
                || str_contains($e->getMessage(), 'daily limit')) {
                return response()->json([
                    'message' => 'The payment gateway is temporarily unavailable.',
                    'status' => 'pending',
                    'rate_limited' => true,
                ], 429);
            }

            return response()->json([
                'message' => 'Failed to query payment status.',
                'status' => 'pending',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 502);
        }

        [$paid, $gatewayStatus] = $this->interpretGatewayStatus($status);

        // What the gateway says about the payment is written down, so the
        // channel, the amount it collected and the reason when there is one
        // are on file and not only in the browser.
        $payment = app(ClickPesaPaymentService::class)->record($status, [
            'pharmacy_id' => $revenue->pharmacy_id,
            'revenue_record_id' => $revenue->id,
            'amount' => $revenue->amount,
            'order_reference' => $validated['reference'],
        ]);

        if ($paid && $revenue->status !== 'paid') {
            $this->activateSubscription($revenue, $payment);
        }

        return response()->json([
            'message' => 'Payment status retrieved.',
            'status' => $revenue->fresh()->status,
            'gateway_status' => $gatewayStatus,
            'paid' => $paid,
            'channel' => $payment?->channel,
            'collected_amount' => $payment?->collected_amount !== null ? (float) $payment->collected_amount : null,
            'reference' => $validated['reference'],
            'message_from_gateway' => $payment?->message,
        ]);
    }

    /**
     * Confirm a subscription payment.
     *
     * The client saying "I paid" is not evidence, so this never activates on
     * request alone: the reference is looked up against our own revenue record
     * and the gateway is asked whether it actually received the money. Access is
     * granted only when ClickPesa reports a settled payment.
     */
    public function confirmPayment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_ref' => 'required|string|max:255',
            'payment_method' => 'sometimes|string|max:50',
        ]);

        $user = $request->user();
        $accessibleIds = $user->accessiblePharmacyIds();
        $pharmacyId = $user->resolveCurrentPharmacyId();

        if (!$pharmacyId || !in_array($pharmacyId, $accessibleIds, true)) {
            return response()->json(['message' => 'No accessible pharmacy found.'], 404);
        }

        $pharmacy = Pharmacy::find($pharmacyId);

        if (!$pharmacy) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        }

        $isOwner = (int) $pharmacy->owner_id === $user->id
            || ($user->role === 'owner' && in_array((int) $pharmacy->id, $accessibleIds, true));

        if (!$isOwner) {
            return response()->json([
                'message' => 'You are not authorized to confirm payment for this pharmacy.',
            ], 403);
        }

        if ($pharmacy->application_status !== 'approved') {
            return response()->json([
                'message' => 'Your pharmacy application has not been approved yet.',
            ], 403);
        }

        if (!$pharmacy->subscription_plan_id) {
            return response()->json(['message' => 'No subscription plan selected.'], 400);
        }

        $revenue = RevenueRecord::where('pharmacy_id', $pharmacy->id)
            ->where('type', 'subscription')
            ->where('payment_reference', $validated['payment_ref'])
            ->latest('id')
            ->first();

        if (!$revenue) {
            return response()->json([
                'message' => 'No subscription payment matches that reference.',
            ], 404);
        }

        if ($revenue->status === 'paid') {
            return response()->json([
                'message' => 'Payment already confirmed.',
                'gateway_status' => 'SUCCESS',
                'pharmacy' => $pharmacy->fresh(),
            ]);
        }

        $service = app(ClickPesaService::class);

        if (!$service->enabled()) {
            return response()->json([
                'message' => 'Payment gateway not configured, so the payment cannot be confirmed. Our team will verify it for you.',
                'status' => 'pending',
            ], 503);
        }

        try {
            $gateway = $service->queryStatus($validated['payment_ref']);
        } catch (\Throwable $e) {
            Log::warning('Subscription payment verification failed: ' . $e->getMessage());

            return response()->json([
                'message' => 'Could not reach the payment gateway to verify this payment. Please try again shortly.',
                'status' => 'pending',
            ], 502);
        }

        [$paid, $gatewayStatus] = $this->interpretGatewayStatus($gateway);

        $payment = app(ClickPesaPaymentService::class)->record($gateway, [
            'pharmacy_id' => $revenue->pharmacy_id,
            'revenue_record_id' => $revenue->id,
            'amount' => $revenue->amount,
            'order_reference' => $validated['payment_ref'],
        ]);

        if (!$paid) {
            return response()->json([
                'message' => 'The payment has not been received yet.',
                'status' => 'pending',
                'gateway_status' => $gatewayStatus,
                'channel' => $payment?->channel,
                'message_from_gateway' => $payment?->message,
            ], 402);
        }

        $this->activateSubscription($revenue, $payment);

        return response()->json([
            'message' => 'Payment confirmed with the payment provider. Subscription activated.',
            'gateway_status' => $gatewayStatus,
            'channel' => $payment?->channel,
            'collected_amount' => $payment?->collected_amount !== null ? (float) $payment->collected_amount : null,
            'pharmacy' => $pharmacy->fresh(),
        ]);
    }

    /**
     * Decide whether a gateway response means the money actually arrived.
     *
     * The gateway's own statuses are the only ones that count: SUCCESS and
     * SETTLED mean the money is ours, PROCESSING and PENDING mean it is on its
     * way, and FAILED, ON-HOLD, REFUNDED and REVERSED mean it is not.
     *
     * @return array{0: bool, 1: string}
     */
    private function interpretGatewayStatus(array $gateway): array
    {
        $status = strtoupper((string) ($gateway['status'] ?? 'PROCESSING'));

        return [ClickPesaPaymentService::isPaid($status), $status];
    }

    private function planSlug(SubscriptionPlan $plan): string
    {
        $slug = strtolower($plan->slug);

        return in_array($slug, ['trial', 'basic', 'pro', 'enterprise', 'starter', 'professional'], true)
            ? $slug
            : strtolower(str_replace(' ', '-', $plan->name));
    }

    private function activateSubscription(RevenueRecord $revenue, ?Payment $payment = null): void
    {
        app(SubscriptionActivationService::class)->activate($revenue, $payment);
    }
}