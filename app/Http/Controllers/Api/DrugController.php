<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Drug;
use App\Models\DrugCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DrugController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $query = Drug::with('category')
                ->when($pharmacyId, fn ($q) => $q->where('pharmacy_id', $pharmacyId));

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('generic_name', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%");
                });
            }

            if ($request->filled('category_id')) {
                $query->where('category_id', $request->input('category_id'));
            }

            if ($request->filled('stock_status')) {
                if ($request->input('stock_status') === 'low') {
                    $query->whereColumn('quantity', '<=', 'reorder_level');
                } elseif ($request->input('stock_status') === 'out') {
                    $query->where('quantity', 0);
                } elseif ($request->input('stock_status') === 'in') {
                    $query->whereColumn('quantity', '>', 'reorder_level');
                }
            }

            if ($request->filled('expiry_status')) {
                if ($request->input('expiry_status') === 'expiring') {
                    $query->whereBetween('expiry_date', [now(), now()->addDays(30)]);
                } elseif ($request->input('expiry_status') === 'expired') {
                    $query->where('expiry_date', '<', now());
                }
            }

            $drugs = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($drugs);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch drugs.',
                'error' => $e->getMessage(),
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
                'nafdac_number' => 'nullable|string|max:255',
                'buying_price' => 'required|numeric|min:0',
                'selling_price' => 'required|numeric|min:0',
                'wholesale_price' => 'sometimes|numeric|min:0',
                'quantity' => 'required|integer|min:0',
                'unit' => 'sometimes|in:tablets,capsules,bottles,tubes,vials',
                'reorder_level' => 'sometimes|integer|min:0',
                'expiry_date' => 'required|date',
                'batch_number' => 'nullable|string|max:255',
                'requires_prescription' => 'sometimes|boolean',
                'is_generic' => 'sometimes|boolean',
                'image' => 'nullable|image|max:2048',
            ]);

            $slug = Str::slug($validated['name']) . '-' . Str::random(5);
            $barcode = strtoupper(Str::random(12));

            $validated['slug'] = $slug;
            $validated['barcode'] = $barcode;

            if ($request->hasFile('image')) {
                $validated['image_url'] = $request->file('image')->store('drugs', 'public');
            }

            unset($validated['image']);

            $drug = Drug::create($validated);

            return response()->json([
                'message' => 'Drug created successfully.',
                'drug' => $drug->load('category'),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create drug.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $drug = Drug::with(['category', 'movements' => function ($q) {
                $q->latest()->limit(20);
            }])->findOrFail($id);

            return response()->json([
                'drug' => $drug,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Drug not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch drug.',
                'error' => $e->getMessage(),
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
                'generic_name' => 'sometimes|nullable|string|max:255',
                'description' => 'sometimes|nullable|string',
                'manufacturer' => 'sometimes|nullable|string|max:255',
                'nafdac_number' => 'sometimes|nullable|string|max:255',
                'barcode' => 'sometimes|string|max:255|unique:drugs,barcode,' . $drug->id,
                'buying_price' => 'sometimes|numeric|min:0',
                'selling_price' => 'sometimes|numeric|min:0',
                'wholesale_price' => 'sometimes|numeric|min:0',
                'quantity' => 'sometimes|integer|min:0',
                'unit' => 'sometimes|in:tablets,capsules,bottles,tubes,vials',
                'reorder_level' => 'sometimes|integer|min:0',
                'expiry_date' => 'sometimes|date',
                'batch_number' => 'sometimes|nullable|string|max:255',
                'requires_prescription' => 'sometimes|boolean',
                'is_generic' => 'sometimes|boolean',
                'is_published' => 'sometimes|boolean',
                'image' => 'nullable|image|max:2048',
            ]);

            if (isset($validated['name']) && $validated['name'] !== $drug->name) {
                $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);
            }

            if ($request->hasFile('image')) {
                if ($drug->image_url) {
                    Storage::disk('public')->delete($drug->image_url);
                }
                $validated['image_url'] = $request->file('image')->store('drugs', 'public');
            }

            unset($validated['image']);

            $drug->update($validated);

            return response()->json([
                'message' => 'Drug updated successfully.',
                'drug' => $drug->fresh()->load('category'),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Drug not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update drug.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $drug = Drug::findOrFail($id);

            if ($drug->image_url) {
                Storage::disk('public')->delete($drug->image_url);
            }

            $drug->delete();

            return response()->json([
                'message' => 'Drug deleted successfully.',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Drug not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete drug.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function lowStock($pharmacyId): JsonResponse
    {
        try {
            $drugs = Drug::where('pharmacy_id', $pharmacyId)
                ->whereColumn('quantity', '<=', 'reorder_level')
                ->with('category')
                ->get();

            return response()->json([
                'drugs' => $drugs,
                'count' => $drugs->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch low stock drugs.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function expiringSoon($pharmacyId): JsonResponse
    {
        try {
            $drugs = Drug::where('pharmacy_id', $pharmacyId)
                ->whereBetween('expiry_date', [now(), now()->addDays(30)])
                ->with('category')
                ->orderBy('expiry_date')
                ->get();

            return response()->json([
                'drugs' => $drugs,
                'count' => $drugs->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch expiring drugs.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function search(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'query' => 'required|string|min:1',
            ]);

            $search = $request->input('query');
            $pharmacyId = $request->input('pharmacy_id');

            $drugs = Drug::where('pharmacy_id', $pharmacyId)
                ->where('quantity', '>', 0)
                ->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('generic_name', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%");
                })
                ->with('category')
                ->limit(20)
                ->get();

            return response()->json([
                'drugs' => $drugs,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to search drugs.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function categories(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');
            $categories = DrugCategory::query()
                ->when($pharmacyId, fn ($q) => $q->where('pharmacy_id', $pharmacyId))
                ->withCount('drugs')
                ->orderBy('name')
                ->get();
            return response()->json([
                'message' => 'Categories retrieved.',
                'data' => $categories,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve categories.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function storeCategory(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string|max:1000',
            ]);

            $category = DrugCategory::create([
                'pharmacy_id' => $request->input('pharmacy_id'),
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
            ]);

            $category->loadCount('drugs');

            return response()->json([
                'message' => 'Category created successfully.',
                'data' => $category,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create category.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function updateCategory(Request $request, $id): JsonResponse
    {
        try {
            $category = DrugCategory::where('pharmacy_id', $request->input('pharmacy_id'))->findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'description' => 'nullable|string|max:1000',
            ]);

            $category->update($validated);

            $category->loadCount('drugs');

            return response()->json([
                'message' => 'Category updated successfully.',
                'data' => $category,
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
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroyCategory(Request $request, $id): JsonResponse
    {
        try {
            $category = DrugCategory::where('pharmacy_id', $request->input('pharmacy_id'))->findOrFail($id);

            $category->delete();

            return response()->json([
                'message' => 'Category deleted successfully.',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Category not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete category.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
