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

        if ($user && !$request->has('pharmacy_id') && !$request->has('pharmacy')) {
            $currentId = $user->resolveCurrentPharmacyId();
            if ($currentId) {
                $request->merge(['pharmacy_id' => $currentId]);
            }
        }

        return $next($request);
    }
}
