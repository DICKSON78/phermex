<?php

namespace App\Http\Middleware;

use App\Models\Pharmacy;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureSubscriptionActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($user->isAdmin() || !$user->isTenantUser()) {
            return $next($request);
        }

        $pharmacyId = $user->resolveCurrentPharmacyId();
        $pharmacy = $pharmacyId ? Pharmacy::find($pharmacyId) : null;

        // No pharmacy context yet (e.g. creating their first pharmacy):
        // let downstream controllers decide.
        if (!$pharmacy) {
            return $next($request);
        }

        if ($pharmacy->application_status !== 'approved') {
            return response()->json([
                'message' => 'Your pharmacy application has not been approved yet.',
                'subscription' => [
                    'application_status' => $pharmacy->application_status,
                    'rejection_reason' => $pharmacy->rejection_reason,
                ],
            ], 403);
        }

        if (!$pharmacy->isActive()) {
            return response()->json([
                'message' => 'Your subscription has expired. Please choose a plan to continue.',
                'subscription' => [
                    'expired' => true,
                    'subscription_type' => $pharmacy->subscriptionType(),
                    'days_remaining' => $pharmacy->daysRemaining(),
                    'trial_ends_at' => $pharmacy->trial_ends_at?->toISOString(),
                    'subscription_end_date' => $pharmacy->subscription_end_date?->toISOString(),
                    'payment_status' => $pharmacy->payment_status,
                    'renewal_url' => '/subscribe',
                ],
            ], 402);
        }

        return $next($request);
    }
}
