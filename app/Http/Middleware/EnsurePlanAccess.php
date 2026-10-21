<?php

namespace App\Http\Middleware;

use App\Models\Pharmacy;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlanAccess
{
    /**
     * Plan levels. Higher number = more features.
     *
     * A trial carries the same level as the top package: for the whole trial
     * window the owner may use every premium feature. As soon as a package is
     * chosen the level drops to that package and the features follow it.
     */
    private const LEVELS = [
        'trial' => 4,
        'basic' => 1,
        'starter' => 2,
        'pro' => 3,
        'professional' => 3,
        'enterprise' => 4,
    ];

    /**
     * API paths that need more than the starter package.
     *
     * This mirrors requiredPlanForPath() in
     * dashboard/src/utils/planConfig.js so the navigation the owner sees and
     * the data the API hands back always agree.
     */
    private const PATH_PLAN = [
        // Enterprise only
        'api/reports/consolidated-financial' => 'enterprise',
        'api/performance' => 'enterprise',
        'api/regulatory-reports' => 'enterprise',

        // Professional
        'api/accounts' => 'professional',
        'api/attendance' => 'professional',
        'api/bank' => 'professional',
        'api/budgets' => 'professional',
        'api/chats' => 'professional',
        'api/controlled-substances' => 'professional',
        'api/damaged-goods' => 'professional',
        'api/deliveries' => 'professional',
        'api/drug-recalls' => 'professional',
        'api/insurance' => 'professional',
        'api/journal' => 'professional',
        'api/leaves' => 'professional',
        'api/licenses' => 'professional',
        'api/loyalty' => 'professional',
        'api/payroll' => 'professional',
        'api/reports/financial' => 'professional',
        'api/stock-returns' => 'professional',
        'api/stock-takes' => 'professional',
        'api/stock-transfers' => 'professional',
        'api/tax' => 'professional',
        'api/telemedicine' => 'professional',
    ];

    /**
     * Paths whose plan cannot be read off a plain prefix because the pharmacy
     * id sits in the middle of them.
     */
    private const PATH_PLAN_PATTERNS = [
        '~^api/pharmacies/[^/]+/reviews$~' => 'professional',
    ];

    private function level(?string $plan): int
    {
        if (!$plan) return 0;
        return self::LEVELS[strtolower($plan)] ?? 0;
    }

    /**
     * The package a path needs, or null when the path is available to every
     * package.
     */
    private function requiredPlanForPath(string $path): ?string
    {
        foreach (self::PATH_PLAN_PATTERNS as $pattern => $plan) {
            if (preg_match($pattern, $path)) return $plan;
        }

        foreach (self::PATH_PLAN as $prefix => $plan) {
            if ($path === $prefix || str_starts_with($path, $prefix . '/')) {
                return $plan;
            }
        }

        return null;
    }

    public function handle(Request $request, Closure $next, ?string $requiredPlan = null): Response
    {
        $user = $request->user();
        if (!$user || $user->isAdmin()) {
            return $next($request);
        }

        $required = $requiredPlan ?: $this->requiredPlanForPath($request->path());
        if (!$required) {
            return $next($request);
        }

        $pharmacyId = $user->resolveCurrentPharmacyId();
        $pharmacy = $pharmacyId ? Pharmacy::find($pharmacyId) : null;

        // No pharmacy context (e.g. creating first pharmacy) — allow through,
        // the controller will enforce limits.
        if (!$pharmacy) {
            return $next($request);
        }

        $currentPlan = $pharmacy->effectivePlan();

        if ($this->level($currentPlan) < $this->level($required)) {
            return response()->json([
                'message' => 'This feature requires the ' . ucfirst($required) . ' plan or higher.',
                'required_plan' => $required,
                'current_plan' => $currentPlan,
                'upgrade_url' => '/subscribe',
            ], 403);
        }

        return $next($request);
    }
}
