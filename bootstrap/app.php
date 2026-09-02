<?php

use App\Http\Middleware\AutoScopePharmacy;
use App\Http\Middleware\EnsureSubscriptionActive;
use App\Http\Middleware\PharmacyScopeMiddleware;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        web: __DIR__.'/../routes/web.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'role' => RoleMiddleware::class,
            'pharmacy.scope' => PharmacyScopeMiddleware::class,
            'auto.scope' => AutoScopePharmacy::class,
            'subscription.active' => EnsureSubscriptionActive::class,
        ]);

        $middleware->statefulApi();

        // Public, unauthenticated form endpoints. Browsers on the deployed
        // domain count as Sanctum "stateful" requests, which would otherwise
        // require a CSRF token that plain fetch() callers never send.
        $middleware->validateCsrfTokens(except: [
            'demo-requests',
            'contact',
            'api/demo-requests',
            'api/contact',
            'api/jobs/*/apply',
            'api/forgot-password',
            'api/reset-password',
            'api/customer-app/register',
            'api/customer-app/login',
            'api/customer-app/forgot-password',
            'api/customer-app/reset-password',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Unauthenticated requests must always receive a 401 JSON response,
        // never an HTML redirect. Redirecting guests to the (unnamed) web
        // login route previously produced "Route [login] not defined" -> 500
        // for every guarded endpoint, including /api/customer-app/* and any
        // client that does not send "Accept: application/json".
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        });
    })->create();
