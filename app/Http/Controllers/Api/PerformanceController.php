<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PerformanceReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PerformanceController extends Controller
{
    private function employeeIsAccessible(Request $request, int $employeeId): bool
    {
        $employee = \App\Models\Employee::where('id', $employeeId)->first();

        return $employee && in_array((int) $employee->pharmacy_id, $request->user()->accessiblePharmacyIds(), true);
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = PerformanceReview::with(['employee', 'reviewer'])->whereHas('employee');

            if ($request->filled('employee_id')) {
                $query->where('employee_id', $request->input('employee_id'));
            }

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('period_start')) {
                $query->where('review_period_start', '>=', $request->input('period_start'));
            }

            if ($request->filled('period_end')) {
                $query->where('review_period_end', '<=', $request->input('period_end'));
            }

            $reviews = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($reviews);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch reviews.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'employee_id' => 'required|exists:employees,id',
                'reviewer_id' => 'required|exists:users,id',
                'review_period_start' => 'required|date',
                'review_period_end' => 'required|date|after_or_equal:review_period_start',
                'rating' => 'required|numeric|min:1|max:5',
                'goals_met' => 'required|numeric|min:0|max:100',
                'strengths' => 'nullable|string|max:2000',
                'areas_for_improvement' => 'nullable|string|max:2000',
                'comments' => 'nullable|string|max:2000',
            ]);

            $validated['status'] = 'draft';

            if (!$this->employeeIsAccessible($request, (int) $validated['employee_id'])) {
                return response()->json([
                    'message' => 'You do not have access to this employee.',
                ], 403);
            }

            $review = PerformanceReview::create($validated);

            return response()->json([
                'message' => 'Review created.',
                'review' => $review->load(['employee', 'reviewer']),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create review.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function show(Request $request, $id): JsonResponse
    {
        try {
            $review = PerformanceReview::with(['employee', 'reviewer'])->findOrFail($id);

            if (!$this->employeeIsAccessible($request, (int) $review->employee_id)) {
                return response()->json([
                    'message' => 'You do not have access to this review.',
                ], 403);
            }

            return response()->json(['review' => $review]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Review not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch review.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $review = PerformanceReview::findOrFail($id);

            if (!$this->employeeIsAccessible($request, (int) $review->employee_id)) {
                return response()->json([
                    'message' => 'You do not have access to this review.',
                ], 403);
            }

            $validated = $request->validate([
                'rating' => 'sometimes|numeric|min:1|max:5',
                'goals_met' => 'sometimes|numeric|min:0|max:100',
                'strengths' => 'nullable|string|max:2000',
                'areas_for_improvement' => 'nullable|string|max:2000',
                'comments' => 'nullable|string|max:2000',
            ]);

            $review->update($validated);

            return response()->json([
                'message' => 'Review updated.',
                'review' => $review->fresh()->load(['employee', 'reviewer']),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Review not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update review.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function submit(Request $request, $id): JsonResponse
    {
        try {
            $review = PerformanceReview::findOrFail($id);

            if (!$this->employeeIsAccessible($request, (int) $review->employee_id)) {
                return response()->json([
                    'message' => 'You do not have access to this review.',
                ], 403);
            }

            if ($review->status !== 'draft') {
                return response()->json([
                    'message' => 'Only draft reviews can be submitted.',
                ], 422);
            }

            $review->update(['status' => 'submitted']);

            return response()->json([
                'message' => 'Review submitted.',
                'review' => $review->fresh()->load(['employee', 'reviewer']),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Review not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to submit review.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function acknowledge(Request $request, $id): JsonResponse
    {
        try {
            $review = PerformanceReview::findOrFail($id);

            if (!$this->employeeIsAccessible($request, (int) $review->employee_id)) {
                return response()->json([
                    'message' => 'You do not have access to this review.',
                ], 403);
            }

            if ($review->status !== 'submitted') {
                return response()->json([
                    'message' => 'Only submitted reviews can be acknowledged.',
                ], 422);
            }

            $review->update(['status' => 'acknowledged']);

            return response()->json([
                'message' => 'Review acknowledged.',
                'review' => $review->fresh()->load(['employee', 'reviewer']),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Review not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to acknowledge review.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function getSummary(Request $request): JsonResponse
    {
        try {
            $query = PerformanceReview::query()->whereHas('employee');

            if ($request->filled('employee_id')) {
                $query->where('employee_id', $request->input('employee_id'));
            }

            if ($request->filled('period_start')) {
                $query->where('review_period_start', '>=', $request->input('period_start'));
            }

            if ($request->filled('period_end')) {
                $query->where('review_period_end', '<=', $request->input('period_end'));
            }

            $reviews = $query->get();

            $avgRating = $reviews->isNotEmpty() ? round($reviews->avg('rating'), 1) : 0;
            $avgGoalsMet = $reviews->isNotEmpty() ? round($reviews->avg('goals_met'), 1) : 0;

            $ratingDistribution = [
                '5' => $reviews->where('rating', '>=', 4.5)->count(),
                '4' => $reviews->where('rating', '>=', 3.5)->where('rating', '<', 4.5)->count(),
                '3' => $reviews->where('rating', '>=', 2.5)->where('rating', '<', 3.5)->count(),
                '2' => $reviews->where('rating', '>=', 1.5)->where('rating', '<', 2.5)->count(),
                '1' => $reviews->where('rating', '<', 1.5)->count(),
            ];

            return response()->json([
                'average_rating' => $avgRating,
                'average_goals_met' => $avgGoalsMet,
                'total_reviews' => $reviews->count(),
                'rating_distribution' => $ratingDistribution,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch summary.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
