<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlanAccess
{
    private const LEVELS = [
        'trial' => 2,
        'basic' => 1,
        'starter' => 2,
        'pro' => 3,
        'professional' => 3,
        'enterprise' => 4,
    ];

    private function level(?string $plan): int
    {
        if (!$plan) return 0;
        return self::LEVELS[strtolower($plan)] ?? 0;
    }

    public function handle(Request $request, Closure $next, string $requiredPlan): Response
    {
        $user = $request->user();
        if (!$user || $user->isAdmin()) {
            return $next($request);
        }

        $pharmacyId = $user->resolveCurrentPharmacyId();
        $pharmacy = $pharmacyId ? \App\Models\Pharmacy::find($pharmacyId) : null;

        // No pharmacy context (e.g. creating first pharmacy) — allow through,
        // the controller will enforce limits.
        if (!$pharmacy) {
            return $next($request);
        }

        $currentPlan = $pharmacy->subscriptionPlan->slug ?? $pharmacy->subscription_plan ?? $pharmacy->subscriptions()->latest('id')->value('plan') ?? ($pharmacy->trial_ends_at && $pharmacy->trial_ends_at->isFuture() ? 'trial' : null);
        $current = strtolower((string) $currentPlan);
        // Trial counts as starter for feature access
        if ($current === 'trial') $current = 'starter';

        if ($this->level($current) < $this->level($requiredPlan)) {
            return response()->json([
                'message' => 'This feature requires the ' . ucfirst($requiredPlan) . ' plan or higher.',
                'required_plan' => $requiredPlan,
                'current_plan' => $currentPlan,
                'upgrade_url' => '/subscribe',
            ], 403);
        }

        return $next($request);
    }
}
