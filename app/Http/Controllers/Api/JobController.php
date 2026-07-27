<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobListing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $jobs = JobListing::where('status', 'active')
                ->where(function ($q) {
                    $q->whereNull('closes_at')->orWhere('closes_at', '>=', now());
                })
                ->latest()
                ->get();

            return response()->json(['data' => $jobs]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch job listings.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $job = JobListing::where('status', 'active')
                ->where(function ($q) {
                    $q->whereNull('closes_at')->orWhere('closes_at', '>=', now());
                })
                ->findOrFail($id);

            return response()->json(['data' => $job]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Job listing not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch job listing.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function apply(Request $request, $jobId): JsonResponse
    {
        try {
            $job = JobListing::where('status', 'active')
                ->where(function ($q) {
                    $q->whereNull('closes_at')->orWhere('closes_at', '>=', now());
                })
                ->findOrFail($jobId);

            if ($job->status !== 'active') {
                return response()->json([
                    'message' => 'This job listing is no longer accepting applications.',
                ], 422);
            }

            $validated = $request->validate([
                'full_name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'phone' => 'nullable|string|max:50',
                'cover_letter' => 'nullable|string',
                'portfolio_url' => 'nullable|string|max:500',
                'linkedin_url' => 'nullable|string|max:500',
            ]);

            $application = $job->applications()->create($validated);

            return response()->json([
                'message' => 'Application submitted successfully. We will review it and get back to you.',
                'data' => $application,
            ], 201);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Job listing not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to submit application.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
