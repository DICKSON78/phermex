<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wholesaler;
use App\Models\WholesaleOrder;
use App\Models\WholesaleInventory;
use App\Models\WholesalePricing;
use App\Models\WholesaleReturn;
use App\Models\WholesaleCreditTerms;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WholesaleManagementController extends Controller
{
    /**
     * Register new wholesaler
     * POST /api/wholesale/register
     */
    public function registerWholesaler(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:wholesalers',
                'phone' => 'required|string|max:20',
                'address' => 'required|string',
                'city' => 'required|string',
                'region' => 'required|string',
                'license_number' => 'required|string|unique:wholesalers',
                'registration_number' => 'required|string',
                'tax_id' => 'nullable|string',
                'bank_account' => 'required|string',
                'bank_name' => 'required|string',
                'contact_person' => 'required|string',
                'contact_phone' => 'required|string',
            ]);

            $wholesalerId = 'WHOLE-' . strtoupper(substr(md5(time()), 0, 6));

            $wholesaler = Wholesaler::create([
                'wholesaler_id' => $wholesalerId,
                ...$validated,
                'status' => 'pending',
            ]);

            Log::info("New wholesaler registered: $wholesalerId - {$validated['name']}");

            return response()->json([
                'success' => true,
                'message' => 'Wholesaler registered successfully',
                'wholesaler_id' => $wholesalerId,
                'status' => 'pending_approval',
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update wholesaler inventory stock
     * POST /api/wholesale/{wholesaler_id}/inventory/update
     */
    public function updateInventory($wholesalerId, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'drug_id' => 'required|string',
                'drug_name' => 'required|string',
                'batch_number' => 'required|string',
                'quantity_in_stock' => 'required|integer',
                'minimum_stock_level' => 'required|integer',
                'reorder_quantity' => 'required|integer',
                'unit_price' => 'required|numeric',
                'expiry_date' => 'required|date',
                'manufacture_date' => 'required|date',
                'location' => 'nullable|string',
            ]);

            $inventory = WholesaleInventory::updateOrCreate(
                [
                    'wholesaler_id' => $wholesalerId,
                    'drug_id' => $validated['drug_id'],
                    'batch_number' => $validated['batch_number'],
                ],
                [
                    ...$validated,
                    'status' => $validated['quantity_in_stock'] <= $validated['minimum_stock_level'] ? 'low_stock' : 'available',
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Inventory updated',
                'inventory' => $inventory,
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get inventory for wholesaler
     * GET /api/wholesale/{wholesaler_id}/inventory
     */
    public function getInventory($wholesalerId, Request $request): JsonResponse
    {
        try {
            $inventory = WholesaleInventory::where('wholesaler_id', $wholesalerId);

            if ($request->has('status')) {
                $inventory->where('status', $request->input('status'));
            }

            if ($request->has('drug_id')) {
                $inventory->where('drug_id', $request->input('drug_id'));
            }

            return response()->json([
                'success' => true,
                'wholesaler_id' => $wholesalerId,
                'inventory' => $inventory->get(),
                'total_items' => $inventory->count(),
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Set pricing for drugs
     * POST /api/wholesale/{wholesaler_id}/pricing
     */
    public function setPricing($wholesalerId, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'drug_id' => 'required|string',
                'price' => 'required|numeric|min:0',
                'minimum_quantity' => 'required|integer|min:1',
                'discount_percentage' => 'nullable|numeric|min:0|max:100',
                'valid_from' => 'required|date',
                'valid_until' => 'nullable|date|after:valid_from',
            ]);

            $pricing = WholesalePricing::updateOrCreate(
                [
                    'wholesaler_id' => $wholesalerId,
                    'drug_id' => $validated['drug_id'],
                ],
                [
                    'price' => $validated['price'],
                    'minimum_quantity' => $validated['minimum_quantity'],
                    'discount_percentage' => $validated['discount_percentage'] ?? 0,
                    'valid_from' => $validated['valid_from'],
                    'valid_until' => $validated['valid_until'],
                    'status' => 'active',
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Pricing updated',
                'pricing' => $pricing,
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Process order fulfillment
     * POST /api/wholesale/{wholesaler_id}/orders/{order_id}/fulfill
     */
    public function fulfillOrder($wholesalerId, $orderId, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'fulfilled_items' => 'required|array',
                'fulfilled_items.*.drug_id' => 'required|string',
                'fulfilled_items.*.quantity_fulfilled' => 'required|integer',
                'fulfilled_items.*.batch_number' => 'required|string',
                'tracking_number' => 'required|string',
                'estimated_delivery_date' => 'required|date',
                'delivery_notes' => 'nullable|string',
            ]);

            $order = WholesaleOrder::where('order_id', $orderId)
                ->where('wholesaler_id', $wholesalerId)
                ->first();

            if (!$order) {
                return response()->json(['success' => false, 'error' => 'Order not found'], 404);
            }

            // Reduce inventory for each fulfilled item
            foreach ($validated['fulfilled_items'] as $item) {
                WholesaleInventory::where('wholesaler_id', $wholesalerId)
                    ->where('drug_id', $item['drug_id'])
                    ->where('batch_number', $item['batch_number'])
                    ->decrement('quantity_in_stock', $item['quantity_fulfilled']);
            }

            // Update order status
            $order->update([
                'status' => 'packed',
                'tracking_number' => $validated['tracking_number'],
                'dispatch_date' => now(),
                'notes' => $validated['delivery_notes'],
            ]);

            Log::info("Order $orderId fulfilled by wholesaler $wholesalerId");

            return response()->json([
                'success' => true,
                'message' => 'Order fulfilled successfully',
                'order_id' => $orderId,
                'tracking_number' => $validated['tracking_number'],
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Handle return request
     * POST /api/wholesale/{wholesaler_id}/returns/create
     */
    public function requestReturn($wholesalerId, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'order_id' => 'required|string',
                'pharmacy_id' => 'required|string',
                'returned_items' => 'required|array',
                'returned_items.*.drug_id' => 'required|string',
                'returned_items.*.quantity' => 'required|integer',
                'returned_items.*.reason' => 'required|in:defective,expired,damaged,wrong_item,quality_issue,other',
                'reason' => 'required|in:defective,expired,damaged,wrong_item,quality_issue,other',
                'description' => 'nullable|string',
            ]);

            // Calculate return amount from order
            $order = WholesaleOrder::where('order_id', $validated['order_id'])->first();
            if (!$order) {
                return response()->json(['success' => false, 'error' => 'Order not found'], 404);
            }

            $returnAmount = collect($validated['returned_items'])->sum(function ($item) use ($order) {
                $orderItem = collect(json_decode($order->items, true))->firstWhere('drug_id', $item['drug_id']);
                return ($orderItem['unit_price'] ?? 0) * $item['quantity'];
            });

            $return = WholesaleReturn::create([
                'order_id' => $validated['order_id'],
                'wholesaler_id' => $wholesalerId,
                'pharmacy_id' => $validated['pharmacy_id'],
                'wholesale_order_id' => $order->id,
                'returned_items' => json_encode($validated['returned_items']),
                'return_amount' => $returnAmount,
                'reason' => $validated['reason'],
                'description' => $validated['description'],
                'status' => 'pending',
                'request_date' => now(),
            ]);

            Log::info("Return request created for order {$validated['order_id']} by pharmacy {$validated['pharmacy_id']}");

            return response()->json([
                'success' => true,
                'message' => 'Return request submitted',
                'return_id' => $return->id,
                'return_amount' => $returnAmount,
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Approve/reject return
     * POST /api/wholesale/{wholesaler_id}/returns/{return_id}/approve
     */
    public function approveReturn($wholesalerId, $returnId, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'action' => 'required|in:approve,reject',
                'notes' => 'nullable|string',
            ]);

            $return = WholesaleReturn::findOrFail($returnId);

            if ($validated['action'] === 'approve') {
                $return->update([
                    'status' => 'refunded',
                    'approval_date' => now(),
                    'refund_date' => now()->addDays(5),
                    'notes' => $validated['notes'],
                ]);

                Log::info("Return approved: Return ID $returnId for amount {$return->return_amount}");

                return response()->json([
                    'success' => true,
                    'message' => 'Return approved. Refund will be processed in 5 days.',
                    'return_id' => $returnId,
                    'refund_amount' => $return->return_amount,
                ]);
            } else {
                $return->update([
                    'status' => 'rejected',
                    'approval_date' => now(),
                    'notes' => $validated['notes'],
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Return rejected',
                    'return_id' => $returnId,
                ]);
            }

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Manage credit terms
     * POST /api/wholesale/{wholesaler_id}/credit-terms
     */
    public function setCreditTerms($wholesalerId, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|string',
                'credit_limit' => 'required|numeric|min:0',
                'payment_terms_days' => 'required|integer|min:7|max:180',
            ]);

            $creditTerms = WholesaleCreditTerms::updateOrCreate(
                [
                    'wholesaler_id' => $wholesalerId,
                    'pharmacy_id' => $validated['pharmacy_id'],
                ],
                [
                    'credit_limit' => $validated['credit_limit'],
                    'payment_terms_days' => $validated['payment_terms_days'],
                    'status' => 'active',
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Credit terms set',
                'credit_terms' => $creditTerms,
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get wholesale orders/analytics
     * GET /api/wholesale/{wholesaler_id}/analytics
     */
    public function getAnalytics($wholesalerId): JsonResponse
    {
        try {
            $orders = WholesaleOrder::where('wholesaler_id', $wholesalerId)->get();
            $totalRevenue = $orders->where('status', 'delivered')->sum('total_amount');
            $avgOrderValue = $orders->avg('total_amount');
            $completionRate = count($orders) > 0 
                ? ($orders->where('status', 'delivered')->count() / count($orders) * 100) 
                : 0;

            return response()->json([
                'success' => true,
                'wholesaler_id' => $wholesalerId,
                'analytics' => [
                    'total_orders' => count($orders),
                    'pending_orders' => $orders->where('status', 'pending')->count(),
                    'completed_orders' => $orders->where('status', 'delivered')->count(),
                    'total_revenue' => $totalRevenue,
                    'average_order_value' => round($avgOrderValue, 2),
                    'completion_rate' => round($completionRate, 2) . '%',
                    'orders_by_status' => $orders->groupBy('status')->map->count(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get list of wholesalers
     * GET /api/wholesale/list?status=active
     */
    public function listWholesalers(Request $request): JsonResponse
    {
        try {
            $query = Wholesaler::query();

            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->has('city')) {
                $query->where('city', $request->input('city'));
            }

            $wholesalers = $query->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $wholesalers,
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
