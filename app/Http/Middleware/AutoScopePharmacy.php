<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AutoScopePharmacy
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if ($user && !$request->has('pharmacy_id')) {
            $pharmacyIds = $user->pharmacy()->pluck('pharmacies.id');
            if ($pharmacyIds->count() === 1) {
                $request->merge(['pharmacy_id' => $pharmacyIds->first()]);
            } elseif ($pharmacyIds->count() > 1) {
                $request->merge(['pharmacy_id' => $pharmacyIds->first()]);
            }
        }

        return $next($request);
    }
}
