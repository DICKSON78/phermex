<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GoodsReceived;
use App\Models\PurchaseOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoodsReceivedController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = GoodsReceived::with(['supplier', 'purchaseOrder', 'receivedBy'])
                ->where('pharmacy_id', $request->input('pharmacy_id'));

            if ($request->filled('status')) {
                $query->where('quality_check', $request->input('status'));
            }

            $grns = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($grns);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch GRNs.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'purchase_order_id' => 'required|exists:purchase_orders,id',
                'received_date' => 'required|date',
                'total_items' => 'required|integer|min:1',
                'total_value' => 'required|numeric|min:0',
                'status' => 'sometimes|in:complete,partial',
                'quality_check' => 'sometimes|in:passed,failed,pending',
                'quality_notes' => 'nullable|string',
                'notes' => 'nullable|string',
            ]);

            $po = PurchaseOrder::findOrFail($validated['purchase_order_id']);

            $grn = GoodsReceived::create([
                ...$validated,
                'grn_number' => GoodsReceived::generateGrnNumber($validated['pharmacy_id']),
                'received_by' => $request->user()->id,
                'supplier_id' => $po->supplier_id,
            ]);

            return response()->json([
                'message' => 'Goods received note created.',
                'grn' => $grn->load('supplier', 'purchaseOrder', 'receivedBy'),
            ], 201);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Purchase order not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create GRN.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $grn = GoodsReceived::with(['supplier', 'purchaseOrder.items.drug', 'receivedBy'])
                ->findOrFail($id);

            return response()->json(['grn' => $grn]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'GRN not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch GRN.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function qualityCheck(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'quality_check' => 'required|in:passed,failed',
                'quality_notes' => 'nullable|string',
            ]);

            $grn = GoodsReceived::findOrFail($id);
            $grn->performQualityCheck($validated['quality_check'], $validated['quality_notes'] ?? null);

            return response()->json([
                'message' => 'Quality check updated.',
                'grn' => $grn->fresh(),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'GRN not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update quality check.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }
}
