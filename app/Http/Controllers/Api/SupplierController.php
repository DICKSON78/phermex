<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Supplier::where('pharmacy_id', $request->input('pharmacy_id'));

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('contact_person', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            if ($request->boolean('active_only')) {
                $query->active();
            }

            $sortBy = $request->input('sort_by', 'name');
            $sortDir = $request->input('sort_dir', 'asc');

            if ($sortBy === 'rating') {
                $query->orderBy('rating', $sortDir);
            } elseif ($sortBy === 'total_orders') {
                $query->orderBy('total_orders', $sortDir);
            } else {
                $query->orderBy('name', $sortDir);
            }

            $suppliers = $query->paginate($request->input('per_page', 20));

            return response()->json($suppliers);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch suppliers.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'name' => 'required|string|max:255',
                'contact_person' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:50',
                'address' => 'nullable|string',
                'city' => 'nullable|string|max:100',
                'country' => 'nullable|string|max:100',
                'tax_id' => 'nullable|string|max:50',
                'payment_terms' => 'sometimes|in:net_15,net_30,net_60,cod',
                'notes' => 'nullable|string',
            ]);

            $supplier = Supplier::create($validated);

            return response()->json(['message' => 'Supplier created.', 'supplier' => $supplier], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create supplier.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $supplier = Supplier::with(['purchaseOrders' => fn ($q) => $q->latest()->limit(20)])
                ->findOrFail($id);

            return response()->json(['supplier' => $supplier]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Supplier not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch supplier.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $supplier = Supplier::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'contact_person' => 'sometimes|nullable|string|max:255',
                'email' => 'sometimes|nullable|email|max:255',
                'phone' => 'sometimes|nullable|string|max:50',
                'address' => 'sometimes|nullable|string',
                'city' => 'sometimes|nullable|string|max:100',
                'country' => 'sometimes|nullable|string|max:100',
                'tax_id' => 'sometimes|nullable|string|max:50',
                'payment_terms' => 'sometimes|in:net_15,net_30,net_60,cod',
                'is_active' => 'sometimes|boolean',
                'notes' => 'sometimes|nullable|string',
            ]);

            $supplier->update($validated);

            return response()->json(['message' => 'Supplier updated.', 'supplier' => $supplier->fresh()]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Supplier not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update supplier.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $supplier = Supplier::findOrFail($id);
            $supplier->delete();

            return response()->json(['message' => 'Supplier deleted.']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Supplier not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete supplier.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function getStats(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');
            $query = Supplier::where('pharmacy_id', $pharmacyId);

            return response()->json([
                'total' => (clone $query)->count(),
                'active' => (clone $query)->active()->count(),
                'avg_rating' => (clone $query)->avg('rating') ?? 0,
                'total_purchased' => (clone $query)->sum('total_purchased'),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch stats.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function getTopSuppliers(Request $request): JsonResponse
    {
        try {
            $suppliers = Supplier::where('pharmacy_id', $request->input('pharmacy_id'))
                ->active()
                ->orderByDesc('total_purchased')
                ->limit(10)
                ->get();

            return response()->json(['suppliers' => $suppliers]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch top suppliers.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }
}
