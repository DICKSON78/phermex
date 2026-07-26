<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockReturn;
use App\Models\StockReturnItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockReturnController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = StockReturn::with(['supplier'])
                ->where('pharmacy_id', $request->input('pharmacy_id'));

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('reason')) {
                $query->where('reason', $request->input('reason'));
            }

            $returns = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($returns);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch returns.', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'supplier_id' => 'required|exists:suppliers,id',
                'return_date' => 'required|date',
                'reason' => 'required|in:damaged,expired,wrong_item,quality_issue,overstock',
                'notes' => 'nullable|string',
                'items' => 'required|array|min:1',
                'items.*.drug_id' => 'required|exists:drugs,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_cost' => 'required|numeric|min:0',
                'items.*.batch_number' => 'nullable|string',
                'items.*.expiry_date' => 'nullable|date',
                'items.*.reason_notes' => 'nullable|string',
            ]);

            $returnNumber = StockReturn::generateReturnNumber($validated['pharmacy_id']);
            $totalItems = 0;
            $totalValue = 0;

            foreach ($validated['items'] as $item) {
                $totalItems += $item['quantity'];
                $totalValue += $item['quantity'] * $item['unit_cost'];
            }

            $stockReturn = DB::transaction(function () use ($validated, $returnNumber, $totalItems, $totalValue) {
                $return = StockReturn::create([
                    'pharmacy_id' => $validated['pharmacy_id'],
                    'supplier_id' => $validated['supplier_id'],
                    'return_number' => $returnNumber,
                    'return_date' => $validated['return_date'],
                    'reason' => $validated['reason'],
                    'status' => 'pending',
                    'total_items' => $totalItems,
                    'total_value' => $totalValue,
                    'notes' => $validated['notes'] ?? null,
                ]);

                foreach ($validated['items'] as $item) {
                    StockReturnItem::create([
                        'stock_return_id' => $return->id,
                        'drug_id' => $item['drug_id'],
                        'quantity' => $item['quantity'],
                        'unit_cost' => $item['unit_cost'],
                        'batch_number' => $item['batch_number'] ?? null,
                        'expiry_date' => $item['expiry_date'] ?? null,
                        'reason_notes' => $item['reason_notes'] ?? null,
                    ]);
                }

                return $return;
            });

            return response()->json([
                'message' => 'Stock return created.',
                'return' => $stockReturn->load('items.drug', 'supplier'),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create return.', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $return = StockReturn::with(['items.drug', 'supplier'])
                ->findOrFail($id);

            return response()->json(['return' => $return]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Return not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch return.', 'error' => $e->getMessage()], 500);
        }
    }

    public function approve($id): JsonResponse
    {
        try {
            $return = StockReturn::findOrFail($id);

            if (!$return->approve()) {
                return response()->json(['message' => 'Cannot approve this return.'], 422);
            }

            return response()->json(['message' => 'Return approved.', 'return' => $return->fresh()]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Return not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to approve return.', 'error' => $e->getMessage()], 500);
        }
    }

    public function ship($id): JsonResponse
    {
        try {
            $return = StockReturn::findOrFail($id);

            if (!$return->ship()) {
                return response()->json(['message' => 'Cannot ship this return.'], 422);
            }

            return response()->json(['message' => 'Return shipped.', 'return' => $return->fresh()]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Return not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to ship return.', 'error' => $e->getMessage()], 500);
        }
    }

    public function refund($id): JsonResponse
    {
        try {
            $return = StockReturn::findOrFail($id);

            if (!$return->refund()) {
                return response()->json(['message' => 'Cannot refund this return.'], 422);
            }

            return response()->json(['message' => 'Return refunded.', 'return' => $return->fresh()]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Return not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to refund return.', 'error' => $e->getMessage()], 500);
        }
    }
}
