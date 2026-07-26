<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DemoRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DemoRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'pharmacy_name' => 'sometimes|nullable|string|max:255',
            'service' => 'sometimes|nullable|string|max:100',
            'message' => 'sometimes|nullable|string|max:2000',
        ]);

        DemoRequest::create($validated);

        return response()->json([
            'message' => 'Demo request submitted successfully. Our team will contact you within 24 hours.',
        ], 201);
    }
}
