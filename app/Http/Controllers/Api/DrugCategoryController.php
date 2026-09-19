<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DrugCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DrugCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $query = DrugCategory::withCount('drugs')
                ->when($pharmacyId, fn ($q) => $q->where('pharmacy_id', $pharmacyId));

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where('name', 'like', "%{$search}%");
            }

            $categories = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($categories);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch drug categories.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
            ]);

            $category = DrugCategory::create($validated);

            return response()->json([
                'message' => 'Category created successfully.',
                'category' => $category,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create category.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $category = DrugCategory::withCount('drugs')->findOrFail($id);

            return response()->json([
                'category' => $category,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Category not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch category.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $category = DrugCategory::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'description' => 'sometimes|nullable|string',
            ]);

            $category->update($validated);

            return response()->json([
                'message' => 'Category updated successfully.',
                'category' => $category->fresh(),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Category not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update category.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $category = DrugCategory::findOrFail($id);

            if ($category->drugs()->count() > 0) {
                return response()->json([
                    'message' => 'Cannot delete category with associated drugs.',
                ], 422);
            }

            $category->delete();

            return response()->json([
                'message' => 'Category deleted successfully.',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Category not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete category.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
