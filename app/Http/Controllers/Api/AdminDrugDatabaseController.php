<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Drug;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminDrugDatabaseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Drug::with(['pharmacy', 'category']);

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('generic_name', 'like', "%{$search}%")
                        ->orWhere('manufacturer', 'like', "%{$search}%")
                        ->orWhere('nafdac_number', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%");
                });
            }

            if ($request->filled('category_id')) {
                $query->where('category_id', $request->input('category_id'));
            }

            if ($request->filled('pharmacy_id')) {
                $query->where('pharmacy_id', $request->input('pharmacy_id'));
            }

            if ($request->filled('is_published')) {
                $query->where('is_published', $request->boolean('is_published'));
            }

            if ($request->filled('requires_prescription')) {
                $query->where('requires_prescription', $request->boolean('requires_prescription'));
            }

            $drugs = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($drugs);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch drugs.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'category_id' => 'nullable|exists:drug_categories,id',
                'name' => 'required|string|max:255',
                'generic_name' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'manufacturer' => 'nullable|string|max:255',
                'nafdac_number' => 'nullable|string|max:100',
                'barcode' => 'nullable|string|max:100',
                'buying_price' => 'required|numeric|min:0',
                'selling_price' => 'required|numeric|min:0',
                'wholesale_price' => 'nullable|numeric|min:0',
                'quantity' => 'required|integer|min:0',
                'unit' => 'nullable|string|max:50',
                'reorder_level' => 'nullable|integer|min:0',
                'expiry_date' => 'nullable|date',
                'batch_number' => 'nullable|string|max:100',
                'requires_prescription' => 'boolean',
                'is_generic' => 'boolean',
                'is_published' => 'boolean',
            ]);

            $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);
            $validated['requires_prescription'] = $validated['requires_prescription'] ?? false;
            $validated['is_generic'] = $validated['is_generic'] ?? false;
            $validated['is_published'] = $validated['is_published'] ?? true;

            $drug = Drug::create($validated);

            return response()->json([
                'message' => 'Drug created successfully.',
                'data' => $drug->load(['pharmacy', 'category']),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create drug.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $drug = Drug::with(['pharmacy', 'category', 'movements'])->findOrFail($id);

            return response()->json(['data' => $drug]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Drug not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch drug.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $drug = Drug::findOrFail($id);

            $validated = $request->validate([
                'category_id' => 'nullable|exists:drug_categories,id',
                'name' => 'sometimes|string|max:255',
                'generic_name' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'manufacturer' => 'nullable|string|max:255',
                'nafdac_number' => 'nullable|string|max:100',
                'barcode' => 'nullable|string|max:100',
                'buying_price' => 'sometimes|numeric|min:0',
                'selling_price' => 'sometimes|numeric|min:0',
                'wholesale_price' => 'nullable|numeric|min:0',
                'quantity' => 'sometimes|integer|min:0',
                'unit' => 'nullable|string|max:50',
                'reorder_level' => 'nullable|integer|min:0',
                'expiry_date' => 'nullable|date',
                'batch_number' => 'nullable|string|max:100',
                'requires_prescription' => 'boolean',
                'is_generic' => 'boolean',
                'is_published' => 'boolean',
            ]);

            if (isset($validated['name']) && $validated['name'] !== $drug->name) {
                $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);
            }

            $drug->update($validated);

            return response()->json([
                'message' => 'Drug updated successfully.',
                'data' => $drug->fresh()->load(['pharmacy', 'category']),
            ]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Drug not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update drug.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $drug = Drug::findOrFail($id);
            $drug->delete();

            return response()->json(['message' => 'Drug deleted successfully.']);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Drug not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete drug.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function toggleStatus(Request $request, $id): JsonResponse
    {
        try {
            $drug = Drug::findOrFail($id);
            $drug->update(['is_published' => !$drug->is_published]);

            return response()->json([
                'message' => 'Drug status toggled.',
                'data' => $drug->fresh(),
            ]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Drug not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to toggle drug status.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
