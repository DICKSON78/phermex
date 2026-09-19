<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class PharmacyScopeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($user->isAdmin()) {
            return $next($request);
        }

        $pharmacyId = $request->route('pharmacy')
            ?? $request->route('pharmacyId')
            ?? $request->input('pharmacy_id')
            ?? $request->query('pharmacy_id');

        if ($pharmacyId) {
            if ($user->isOwner()) {
                $hasAccess = $user->pharmacy()->where('pharmacies.id', $pharmacyId)->exists()
                    || \App\Models\Pharmacy::where('id', $pharmacyId)
                        ->where('owner_id', $user->id)
                        ->exists();

                if (!$hasAccess) {
                    return response()->json([
                        'message' => 'You do not have access to this pharmacy.',
                    ], 403);
                }
            } else {
                $hasAccess = $user->pharmacy()->where('pharmacies.id', $pharmacyId)->exists();

                if (!$hasAccess) {
                    return response()->json([
                        'message' => 'You do not have access to this pharmacy.',
                    ], 403);
                }
            }
        }

        return $next($request);
    }
}
