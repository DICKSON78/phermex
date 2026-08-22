<?php

use Illuminate\Support\Facades\Route;

// ======================================================================
// Dashboard SPA
// ======================================================================

// Redirect legacy role-prefixed dashboard URLs to the unified /dashboard
Route::get('/dashboard/{role}/{subpath?}', function ($role, $subpath = '') {
    return redirect('/dashboard' . ($subpath ? '/' . $subpath : ''), 301);
})->where('role', 'owner|admin|seller')->where('subpath', '.*');

// Redirect legacy dashboard auth URLs to clean root URLs
Route::redirect('/dashboard/login', '/login', 301);
Route::redirect('/dashboard/register', '/register', 301);
Route::redirect('/dashboard/register/owner', '/register/owner', 301);
Route::redirect('/dashboard/forgot-password', '/forgot-password', 301);
Route::redirect('/dashboard/pending-approval', '/pending-approval', 301);
Route::redirect('/dashboard/subscribe', '/subscribe', 301);
Route::redirect('/dashboard/app', '/app', 301);
Route::redirect('/dashboard/home', '/home', 301);

// Root-level dashboard auth pages (served by the dashboard SPA)
$dashboardIndex = function () {
    return response()->file(public_path('dashboard/index.html'), [
        'Cache-Control' => 'no-cache, no-store, must-revalidate',
    ]);
};
Route::get('/login', $dashboardIndex);
Route::get('/register', $dashboardIndex);
Route::get('/register/owner', $dashboardIndex);
Route::get('/forgot-password', $dashboardIndex);
Route::get('/pending-approval', $dashboardIndex);
Route::get('/subscribe', $dashboardIndex);
Route::get('/app', $dashboardIndex);
Route::get('/home', $dashboardIndex);

// Dashboard SPA (assets + history fallback)
Route::get('/dashboard/{any?}', function ($any = null) use ($dashboardIndex) {
    $path = trim($any ?: '/', '/');

    if ($path && file_exists(public_path('dashboard/' . $path))) {
        $file = public_path('dashboard/' . $path);
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $mimeMap = [
            'js'    => 'application/javascript',
            'mjs'   => 'application/javascript',
            'css'   => 'text/css',
            'html'  => 'text/html',
            'json'  => 'application/json',
            'png'   => 'image/png',
            'jpg'   => 'image/jpeg',
            'jpeg'  => 'image/jpeg',
            'svg'   => 'image/svg+xml',
            'ico'   => 'image/x-icon',
            'webp'  => 'image/webp',
            'woff'  => 'font/woff',
            'woff2' => 'font/woff2',
            'map'   => 'application/json',
            'mp4'   => 'video/mp4',
        ];
        $mime = $mimeMap[$ext] ?? 'application/octet-stream';
        return response()->file($file, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }

    return $dashboardIndex();
})->where('any', '.*');

// ======================================================================
// API routes
// ======================================================================

Route::post('/demo-requests', [\App\Http\Controllers\Api\DemoRequestController::class, 'store']);

Route::post('/contact', function (\Illuminate\Http\Request $request) {
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|max:255',
        'phone' => 'sometimes|nullable|string|max:20',
        'subject' => 'sometimes|nullable|string|max:255',
        'message' => 'sometimes|nullable|string|max:2000',
    ]);
    \App\Models\DemoRequest::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'phone' => $validated['phone'] ?? '',
        'service' => $validated['subject'],
        'message' => $validated['message'] ?? '',
    ]);
    return response()->json(['message' => 'Message sent successfully!'], 201);
});

// ======================================================================
// Marketing website SPA
// ======================================================================

Route::get('/{any?}', function ($any = null) {
    $path = trim($any ?: '/', '/');
    if ($path && $path !== '/' && file_exists(public_path('website/' . $path))) {
        $file = public_path('website/' . $path);
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $mimeMap = [
            'js'    => 'application/javascript',
            'mjs'   => 'application/javascript',
            'css'   => 'text/css',
            'html'  => 'text/html',
            'json'  => 'application/json',
            'png'   => 'image/png',
            'jpg'   => 'image/jpeg',
            'jpeg'  => 'image/jpeg',
            'gif'   => 'image/gif',
            'svg'   => 'image/svg+xml',
            'ico'   => 'image/x-icon',
            'webp'  => 'image/webp',
            'mp4'   => 'video/mp4',
            'woff'  => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf'   => 'font/ttf',
            'pdf'   => 'application/pdf',
        ];
        $mime = $mimeMap[$ext] ?? 'application/octet-stream';
        return response()->file($file, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }
    return response()->file(public_path('website/index.html'), [
        'Cache-Control' => 'no-cache, no-store, must-revalidate',
    ]);
})->where('any', '.*');
