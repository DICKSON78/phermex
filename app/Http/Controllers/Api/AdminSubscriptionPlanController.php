<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSubscriptionPlanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $plans = SubscriptionPlan::orderBy('sort_order')->orderBy('id')->get();
            return response()->json(['data' => $plans]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch subscription plans.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $plan = SubscriptionPlan::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|string|max:100',
                'description' => 'sometimes|nullable|string|max:500',
                'duration_months' => 'sometimes|integer|min:1|max:120',
                'price' => 'sometimes|numeric|min:0',
                'currency' => 'sometimes|string|max:10',
                'grace_period_days' => 'sometimes|integer|min:0|max:90',
                'sort_order' => 'sometimes|integer|min:0',
                'is_active' => 'sometimes|boolean',
            ]);

            $old = $plan->toArray();
            $plan->update($validated);

            AuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'subscription_plan_updated',
                'model_type' => SubscriptionPlan::class,
                'model_id' => $plan->id,
                'new_values' => ['old' => $old, 'new' => $plan->fresh()->toArray()],
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Subscription plan updated.',
                'data' => $plan->fresh(),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Plan not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update subscription plan.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
