<?php

use Illuminate\Support\Facades\Route;

Route::get('/dashboard/{any?}', function ($any = null) {
    return response()->file(public_path('dashboard/index.html'), [
        'Cache-Control' => 'no-cache, no-store, must-revalidate',
    ]);
})->where('any', '.*');

Route::post('/demo-requests', [\App\Http\Controllers\Api\DemoRequestController::class, 'store']);

Route::post('/contact', function (\Illuminate\Http\Request $request) {
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|max:255',
        'subject' => 'required|string|max:255',
        'message' => 'required|string|max:2000',
    ]);
    \App\Models\DemoRequest::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'phone' => '',
        'service' => $validated['subject'],
        'message' => $validated['message'],
    ]);
    return redirect()->back()->with('success', 'Message sent successfully!');
});

Route::get('/{any?}', function ($any = null) {
    $path = trim($any ?: '/', '/');
    if ($path && $path !== '/' && file_exists(public_path('website/' . $path))) {
        $file = public_path('website/' . $path);
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $mimeMap = [
            'js' => 'application/javascript',
            'mjs' => 'application/javascript',
            'css' => 'text/css',
            'html' => 'text/html',
            'json' => 'application/json',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'ico' => 'image/x-icon',
            'webp' => 'image/webp',
            'mp4' => 'video/mp4',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf',
            'pdf' => 'application/pdf',
        ];
        $mime = $mimeMap[$ext] ?? (mime_content_type($file) ?: 'application/octet-stream');
        $headers = [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ];
        return response()->file($file, $headers);
    }
    return response()->file(public_path('website/index.html'), [
        'Cache-Control' => 'no-cache, no-store, must-revalidate',
    ]);
})->where('any', '.*');
