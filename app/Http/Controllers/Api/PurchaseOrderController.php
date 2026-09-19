<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = PurchaseOrder::with('supplier')
                ->where('pharmacy_id', $request->input('pharmacy_id'));

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('supplier_id')) {
                $query->where('supplier_id', $request->input('supplier_id'));
            }

            if ($request->filled('date_from')) {
                $query->where('order_date', '>=', $request->input('date_from'));
            }

            if ($request->filled('date_to')) {
                $query->where('order_date', '<=', $request->input('date_to'));
            }

            $orders = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($orders);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch purchase orders.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'supplier_id' => 'required|exists:suppliers,id',
                'order_date' => 'required|date',
                'expected_delivery_date' => 'nullable|date|after_or_equal:order_date',
                'tax_amount' => 'sometimes|numeric|min:0',
                'discount_amount' => 'sometimes|numeric|min:0',
                'notes' => 'nullable|string',
                'items' => 'required|array|min:1',
                'items.*.drug_id' => 'required|exists:drugs,id',
                'items.*.quantity_ordered' => 'required|integer|min:1',
                'items.*.unit_cost' => 'required|numeric|min:0',
                'items.*.batch_number' => 'nullable|string',
                'items.*.expiry_date' => 'nullable|date',
                'items.*.notes' => 'nullable|string',
            ]);

            $orderNumber = PurchaseOrder::generateOrderNumber($validated['pharmacy_id']);

            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $subtotal += $item['quantity_ordered'] * $item['unit_cost'];
            }

            $taxAmount = $validated['tax_amount'] ?? 0;
            $discountAmount = $validated['discount_amount'] ?? 0;

            $order = DB::transaction(function () use ($validated, $orderNumber, $subtotal, $taxAmount, $discountAmount) {
                $order = PurchaseOrder::create([
                    'pharmacy_id' => $validated['pharmacy_id'],
                    'supplier_id' => $validated['supplier_id'],
                    'order_number' => $orderNumber,
                    'order_date' => $validated['order_date'],
                    'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                    'status' => 'draft',
                    'subtotal' => $subtotal,
                    'tax_amount' => $taxAmount,
                    'discount_amount' => $discountAmount,
                    'total' => $subtotal + $taxAmount - $discountAmount,
                    'notes' => $validated['notes'] ?? null,
                ]);

                foreach ($validated['items'] as $item) {
                    PurchaseOrderItem::create([
                        'purchase_order_id' => $order->id,
                        'drug_id' => $item['drug_id'],
                        'quantity_ordered' => $item['quantity_ordered'],
                        'unit_cost' => $item['unit_cost'],
                        'total_cost' => $item['quantity_ordered'] * $item['unit_cost'],
                        'batch_number' => $item['batch_number'] ?? null,
                        'expiry_date' => $item['expiry_date'] ?? null,
                        'notes' => $item['notes'] ?? null,
                    ]);
                }

                return $order;
            });

            return response()->json([
                'message' => 'Purchase order created.',
                'order' => $order->load('items.drug', 'supplier'),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create purchase order.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $order = PurchaseOrder::with(['items.drug', 'supplier', 'goodsReceived', 'approvedBy', 'receivedBy'])
                ->findOrFail($id);

            return response()->json(['order' => $order]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Purchase order not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch purchase order.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function approve(Request $request, $id): JsonResponse
    {
        try {
            $order = PurchaseOrder::findOrFail($id);
            $user = $request->user();

            if (!$order->approve($user)) {
                return response()->json(['message' => 'Cannot approve this order.'], 422);
            }

            return response()->json(['message' => 'Order approved.', 'order' => $order->fresh()->load('supplier')]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Purchase order not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to approve order.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function receive(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'items' => 'required|array|min:1',
                'items.*.id' => 'required|exists:purchase_order_items,id',
                'items.*.quantity_received' => 'required|integer|min:0',
                'items.*.batch_number' => 'nullable|string',
                'items.*.expiry_date' => 'nullable|date',
            ]);

            $order = PurchaseOrder::findOrFail($id);
            $user = $request->user();

            DB::transaction(function () use ($order, $validated, $user) {
                $allReceived = true;
                $anyReceived = false;

                foreach ($validated['items'] as $itemData) {
                    $item = PurchaseOrderItem::findOrFail($itemData['id']);
                    $item->update([
                        'quantity_received' => $itemData['quantity_received'],
                        'batch_number' => $itemData['batch_number'] ?? $item->batch_number,
                        'expiry_date' => $itemData['expiry_date'] ?? $item->expiry_date,
                    ]);

                    if ($itemData['quantity_received'] > 0) {
                        $anyReceived = true;
                        $drug = \App\Models\Drug::find($item->drug_id);
                        if ($drug) {
                            $drug->increment('quantity', $itemData['quantity_received']);
                            if ($itemData['batch_number']) {
                                $drug->update(['batch_number' => $itemData['batch_number']]);
                            }
                            if ($itemData['expiry_date']) {
                                $drug->update(['expiry_date' => $itemData['expiry_date']]);
                            }
                        }
                    }

                    if ($itemData['quantity_received'] < $item->quantity_ordered) {
                        $allReceived = false;
                    }
                }

                if ($allReceived) {
                    $order->receive($user);
                } else {
                    $order->update(['status' => 'partially_received']);
                }
            });

            return response()->json(['message' => 'Goods received.', 'order' => $order->fresh()->load('items.drug')]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Order or item not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to receive goods.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function cancel($id): JsonResponse
    {
        try {
            $order = PurchaseOrder::findOrFail($id);

            if (!$order->cancel()) {
                return response()->json(['message' => 'Cannot cancel this order.'], 422);
            }

            return response()->json(['message' => 'Order cancelled.', 'order' => $order->fresh()]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Purchase order not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to cancel order.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function getStats(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');
            $query = PurchaseOrder::where('pharmacy_id', $pharmacyId);

            return response()->json([
                'total_orders' => (clone $query)->count(),
                'pending_approval' => (clone $query)->where('status', 'pending_approval')->count(),
                'ordered' => (clone $query)->where('status', 'ordered')->count(),
                'total_value' => (clone $query)->sum('total'),
                'pending_value' => (clone $query)->whereIn('status', ['approved', 'ordered'])->sum('total'),
                'received_value' => (clone $query)->where('status', 'received')->sum('total'),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch stats.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }
}
