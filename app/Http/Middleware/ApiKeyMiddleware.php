<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApiKeyMiddleware
{
    public function handle(Request $request, Closure $next, $type = null)
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json([
                'success' => false,
                'error' => 'Missing or invalid Authorization header',
                'message' => 'Please provide: Authorization: Bearer {api_key}',
            ], 401);
        }

        $apiKey = str_replace('Bearer ', '', $authHeader);
        $apiKeyHash = hash('sha256', $apiKey);

        $integration = DB::table('api_integrations')
            ->where('api_key', $apiKeyHash)
            ->first();

        if (!$integration) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid API key',
            ], 401);
        }

        if ($integration->status !== 'active') {
            return response()->json([
                'success' => false,
                'error' => 'API key is ' . $integration->status,
            ], 403);
        }

        // Update last used time
        DB::table('api_integrations')
            ->where('id', $integration->id)
            ->update(['last_used_at' => now()]);

        $request->merge(['_api_integration' => $integration]);

        return $next($request);
    }
}
