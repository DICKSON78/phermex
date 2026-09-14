<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy;
use App\Models\RevenueRecord;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Services\ClickPesaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SubscriptionController extends Controller
{
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

        return response()->json([
            'has_pharmacy' => true,
            'application_status' => $pharmacy->application_status,
            'subscription_type' => $pharmacy->subscriptionType(),
            'days_remaining' => $pharmacy->daysRemaining(),
            'trial_ends_at' => $pharmacy->trial_ends_at?->toISOString(),
            'subscription_end_date' => $pharmacy->subscription_end_date?->toISOString(),
            'payment_status' => $pharmacy->payment_status,
            'rejection_reason' => $pharmacy->rejection_reason,
            'pharmacy_name' => $pharmacy->pharmacy_name,
        ]);
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

        Subscription::create([
            'pharmacy_id' => $pharmacy->id,
            'plan' => $planSlug,
            'amount' => $plan->price,
            'status' => 'active',
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);

        RevenueRecord::create([
            'pharmacy_id' => $pharmacy->id,
            'pharmacy_name' => $pharmacy->pharmacy_name,
            'type' => 'subscription',
            'amount' => $plan->price,
            'description' => 'Subscription: ' . $plan->name,
            'invoice_number' => RevenueRecord::generateInvoiceNumber(),
            'status' => 'pending',
            'due_date' => $startDate->copy()->addDays(7),
            'payment_method' => $validated['payment_method'] ?? null,
        ]);

        $pharmacy->update([
            'subscription_plan_id' => $plan->id,
            'subscription_amount' => $plan->price,
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

        $plan = SubscriptionPlan::findOrFail($validated['plan_id']);
        $rate = (float) config('services.subscriptions.tzs_per_usd', 2600);
        $amountTzs = round((float) $plan->price * $rate);

        $startDate = now();
        $endDate = $startDate->copy()->addMonths($plan->duration_months);

        // If a pending record already exists for this plan, re-use it so the
        // checkout is idempotent (no duplicated invoices on retry).
        $subscription = Subscription::where('pharmacy_id', $pharmacy->id)
            ->where('plan', $this->planSlug($plan))
            ->where('status', 'active')
            ->latest('id')
            ->first();

        if (!$subscription || !$subscription->start_date->isToday()) {
            $subscription = Subscription::create([
                'pharmacy_id' => $pharmacy->id,
                'plan' => $this->planSlug($plan),
                'amount' => $plan->price,
                'status' => 'active',
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

        if ($service->enabled()) {
            try {
                $pushRef = 'HELIX-SUB-' . $subscription->id . '-' . strtoupper(Str::random(6));
                $push = $service->initiatePush((string) $amountTzs, $validated['phone'], $pushRef);
                $reference = $push['orderReference'] ?? $pushRef;
                $pushInitiated = true;

                $subscription->update([
                    'transaction_id' => $reference,
                    'payment_method' => 'mobile',
                ]);

                $revenue->update([
                    'payment_reference' => $reference,
                    'payment_method' => 'mobile',
                ]);
            } catch (\Throwable $e) {
                Log::warning('Subscription ClickPesa push init failed: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => $pushInitiated
                ? 'Payment prompt sent to your phone. Confirm the M-PESA push to activate your plan.'
                : 'Subscription reserved. Complete payment to activate.',
            'push_initiated' => $pushInitiated,
            'reference' => $reference,
            'subscription' => [
                'id' => $subscription->id,
                'plan' => $plan,
                'amount_usd' => (float) $plan->price,
                'amount_tzs' => $amountTzs,
                'currency' => 'TZS',
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
            return response()->json([
                'message' => 'Failed to query payment status.',
                'status' => 'pending',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 502);
        }

        $gatewayStatus = strtoupper($status['status'] ?? 'PROCESSING');
        $paid = str_contains($gatewayStatus, 'SUCCESS')
            || str_contains($gatewayStatus, 'SETTLED')
            || str_contains($gatewayStatus, 'RECEIVED');

        if ($paid && $revenue->status !== 'paid') {
            $this->activateSubscription($revenue);
        }

        return response()->json([
            'message' => 'Payment status retrieved.',
            'status' => $revenue->fresh()->status,
            'gateway_status' => $gatewayStatus,
            'paid' => $paid,
        ]);
    }

    public function confirmPayment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_ref' => 'sometimes|string|max:255',
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

        $subscription = Subscription::where('pharmacy_id', $pharmacy->id)
            ->where('status', 'active')
            ->latest('id')
            ->first();

        $pharmacy->update([
            'payment_status' => 'paid',
            'status' => 'active',
            'is_published' => true,
        ]);

        if ($subscription) {
            $subscription->update([
                'transaction_id' => $validated['payment_ref']
                    ?? $subscription->transaction_id
                    ?? 'TXN-' . strtoupper(Str::random(10)),
                'payment_method' => $validated['payment_method'] ?? $subscription->payment_method ?? 'manual',
            ]);
        }

        RevenueRecord::where('pharmacy_id', $pharmacy->id)
            ->where('type', 'subscription')
            ->where('status', 'pending')
            ->latest('id')
            ->first()
            ?->update([
                'status' => 'paid',
                'paid_at' => now(),
                'payment_method' => $validated['payment_method'] ?? null,
            ]);

        return response()->json([
            'message' => 'Payment confirmed. Subscription activated.',
            'pharmacy' => $pharmacy->fresh(),
        ]);
    }

    private function planSlug(SubscriptionPlan $plan): string
    {
        $slug = strtolower($plan->slug);

        return in_array($slug, ['trial', 'basic', 'pro', 'enterprise', 'starter', 'professional'], true)
            ? $slug
            : strtolower(str_replace(' ', '-', $plan->name));
    }

    private function activateSubscription(RevenueRecord $revenue): void
    {
        $revenue->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $subscription = Subscription::where('pharmacy_id', $revenue->pharmacy_id)
            ->where('status', 'active')
            ->latest('id')
            ->first();

        if ($subscription) {
            $subscription->update([
                'transaction_id' => $revenue->payment_reference ?? $subscription->transaction_id,
                'payment_method' => 'mobile',
                'status' => 'active',
            ]);
        }

        Pharmacy::where('id', $revenue->pharmacy_id)->update([
            'payment_status' => 'paid',
            'status' => 'active',
            'is_published' => true,
        ]);
    }
}