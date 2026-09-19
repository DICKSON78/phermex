<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobListing;
use App\Models\JobApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminJobController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $jobs = JobListing::withCount('applications')->latest()->paginate(20);

            return response()->json($jobs);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch job listings.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'department' => 'required|string|max:255',
                'location' => 'required|string|max:255',
                'type' => 'required|in:full_time,part_time,contract,internship,remote',
                'description' => 'required|string',
                'requirements' => 'nullable|string',
                'responsibilities' => 'nullable|string',
                'salary_range' => 'nullable|string|max:255',
                'status' => 'sometimes|in:active,closed,draft',
                'is_hot' => 'sometimes|boolean',
                'is_new' => 'sometimes|boolean',
                'closes_at' => 'nullable|date',
            ]);

            $job = JobListing::create($validated);

            return response()->json([
                'message' => 'Job listing created successfully.',
                'data' => $job,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create job listing.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $job = JobListing::with(['applications' => function ($q) {
                $q->latest();
            }])->withCount('applications')->findOrFail($id);

            return response()->json(['data' => $job]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Job listing not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch job listing.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $job = JobListing::findOrFail($id);

            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'department' => 'sometimes|string|max:255',
                'location' => 'sometimes|string|max:255',
                'type' => 'sometimes|in:full_time,part_time,contract,internship,remote',
                'description' => 'sometimes|string',
                'requirements' => 'nullable|string',
                'responsibilities' => 'nullable|string',
                'salary_range' => 'nullable|string|max:255',
                'status' => 'sometimes|in:active,closed,draft',
                'is_hot' => 'sometimes|boolean',
                'is_new' => 'sometimes|boolean',
                'closes_at' => 'nullable|date',
            ]);

            $job->update($validated);

            return response()->json([
                'message' => 'Job listing updated successfully.',
                'data' => $job->fresh(),
            ]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Job listing not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update job listing.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $job = JobListing::findOrFail($id);
            $job->delete();

            return response()->json(['message' => 'Job listing deleted successfully.']);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Job listing not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete job listing.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function toggleStatus($id): JsonResponse
    {
        try {
            $job = JobListing::findOrFail($id);
            $newStatus = $job->status === 'active' ? 'closed' : 'active';
            $job->update(['status' => $newStatus]);

            return response()->json([
                'message' => "Job listing status changed to {$newStatus}.",
                'data' => $job->fresh(),
            ]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Job listing not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to toggle job status.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function applications(Request $request, $jobId): JsonResponse
    {
        try {
            $job = JobListing::findOrFail($jobId);
            $applications = $job->applications()->latest()->paginate(20);

            return response()->json($applications);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Job listing not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch applications.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function updateApplication(Request $request, $applicationId): JsonResponse
    {
        try {
            $application = JobApplication::findOrFail($applicationId);

            $validated = $request->validate([
                'status' => 'sometimes|in:pending,reviewed,shortlisted,interviewed,hired,rejected',
                'admin_notes' => 'nullable|string',
            ]);

            $application->update($validated);

            return response()->json([
                'message' => 'Application updated successfully.',
                'data' => $application->fresh()->load('jobListing'),
            ]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Application not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update application.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function allApplications(Request $request): JsonResponse
    {
        try {
            $query = JobApplication::with('jobListing');

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            $applications = $query->latest()->paginate(20);

            return response()->json($applications);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch applications.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
