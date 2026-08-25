<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy;
use App\Models\RevenueRecord;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        $pharmacy = $pharmacyId ? \App\Models\Pharmacy::find($pharmacyId) : null;

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
        $pharmacy = $pharmacyId ? \App\Models\Pharmacy::find($pharmacyId) : null;

        if (!$pharmacy) {
            return response()->json(['message' => 'No pharmacy found.'], 404);
        }

        if ($pharmacy->application_status !== 'approved') {
            return response()->json(['message' => 'Your application has not been approved yet.'], 403);
        }

        $plan = SubscriptionPlan::findOrFail($validated['plan_id']);

        $startDate = now();
        $endDate = $startDate->copy()->addMonths($plan->duration_months);

        $planSlug = in_array($plan->slug, ['trial', 'basic', 'pro', 'enterprise'], true)
            ? $plan->slug
            : strtolower($plan->name);

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

    public function confirmPayment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pharmacy_id' => 'required|exists:pharmacies,id',
            'payment_ref' => 'sometimes|string|max:255',
            'payment_method' => 'sometimes|string|max:50',
        ]);

        $pharmacy = Pharmacy::findOrFail($validated['pharmacy_id']);

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
                'transaction_id' => $validated['payment_ref'] ?? null,
                'payment_method' => $validated['payment_method'] ?? $subscription->payment_method,
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
}
