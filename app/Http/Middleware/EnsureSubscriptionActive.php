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

        // Manual approval is gone: a pending pharmacy is approved on the spot
        // and its 30 day trial starts, so old tokens keep working too. A
        // rejected application is the only one that still gets blocked.
        if ($pharmacy->application_status !== 'approved') {
            if (! $pharmacy->autoApprove()) {
                return response()->json([
                    'message' => 'Your pharmacy application has been rejected.',
                    'subscription' => [
                        'application_status' => $pharmacy->application_status,
                        'rejection_reason' => $pharmacy->rejection_reason,
                    ],
                ], 403);
            }

            $pharmacy->refresh();
        }

        if (!$pharmacy->isActive()) {
            // Locked-down accounts can still access essential account/settings
            // endpoints (pharmacy profile, subscription status, plans) while
            // they renew. Every other pharmacy-scoped API stays blocked.
            if (!$this->isAllowedWhileExpired($request)) {
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
        }

        return $next($request);
    }

    protected function isAllowedWhileExpired(Request $request): bool
    {
        $uri = $request->path();
        $method = $request->method();

        if ($request->is('api/subscriptions/*')) return true;

        if ($uri === 'api/pharmacies') return true;
        if ($uri === 'api/pharmacies/current') return true;
        if ($request->is('api/pharmacies/*/switch')) return true;
        if ($request->is('api/pharmacies/*/stats')) return true;
        if ($request->is('api/pharmacies/*') && in_array($method, ['GET', 'PUT'], true)) return true;

        return false;
    }
}
