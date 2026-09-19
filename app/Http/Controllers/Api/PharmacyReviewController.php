<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy;
use App\Models\PharmacyReview;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PharmacyReviewController extends Controller
{
    public function store(Request $request, string $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'rating' => 'required|integer|between:1,5',
                'review' => 'sometimes|nullable|string|max:1000',
            ]);

            $pharmacy = Pharmacy::where('status', 'active')
                ->where('is_published', true)
                ->findOrFail($id);

            $user = $request->user();

            DB::beginTransaction();

            $review = PharmacyReview::updateOrCreate(
                ['user_id' => $user->id, 'pharmacy_id' => $pharmacy->id],
                [
                    'rating' => $validated['rating'],
                    'review' => $validated['review'] ?? null,
                ]
            );

            $pharmacy->rating = $pharmacy->reviews()->avg('rating');
            $pharmacy->total_reviews = $pharmacy->reviews()->count();
            $pharmacy->save();

            DB::commit();

            return response()->json([
                'message' => 'Review saved successfully.',
                'data' => $review->load('user:id,name'),
            ], 201);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'error' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to save review.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function index(Request $request, string $id): JsonResponse
    {
        try {
            $pharmacy = Pharmacy::where('status', 'active')
                ->where('is_published', true)
                ->findOrFail($id);

            $reviews = $pharmacy->reviews()
                ->with('user:id,name')
                ->latest()
                ->paginate($request->input('per_page', 20));

            $currentUserId = $request->user()?->id;
            $hasReviewed = $pharmacy->reviews()
                ->where('user_id', $currentUserId)
                ->exists();

            return response()->json([
                'message' => 'Reviews retrieved.',
                'data' => [
                    'reviews' => $reviews,
                    'rating' => (float) $pharmacy->rating,
                    'total_reviews' => (int) $pharmacy->total_reviews,
                    'has_reviewed' => $hasReviewed,
                ],
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve reviews.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function pharmacyReviews(Request $request, string $id): JsonResponse
    {
        try {
            $pharmacy = Pharmacy::findOrFail($id);

            $reviews = $pharmacy->reviews()
                ->with('user:id,name')
                ->latest()
                ->paginate($request->input('per_page', 20));

            return response()->json([
                'message' => 'Reviews retrieved.',
                'data' => [
                    'reviews' => $reviews,
                    'rating' => (float) $pharmacy->rating,
                    'total_reviews' => (int) $pharmacy->total_reviews,
                ],
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve reviews.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
