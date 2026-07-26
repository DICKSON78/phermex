<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy;
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
        $pharmacy = $user->pharmacy()->first();

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
        $pharmacy = $user->pharmacy()->first();

        if (!$pharmacy) {
            return response()->json(['message' => 'No pharmacy found.'], 404);
        }

        if ($pharmacy->application_status !== 'approved') {
            return response()->json(['message' => 'Your application has not been approved yet.'], 403);
        }

        $plan = SubscriptionPlan::findOrFail($validated['plan_id']);

        $startDate = now();
        $endDate = $startDate->copy()->addMonths($plan->duration_months);

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
        ]);

        $pharmacy = Pharmacy::findOrFail($validated['pharmacy_id']);

        if (!$pharmacy->subscription_plan_id) {
            return response()->json(['message' => 'No subscription plan selected.'], 400);
        }

        $pharmacy->update([
            'payment_status' => 'paid',
            'status' => 'active',
            'is_published' => true,
        ]);

        return response()->json([
            'message' => 'Payment confirmed. Subscription activated.',
            'pharmacy' => $pharmacy->fresh(),
        ]);
    }
}
