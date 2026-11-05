<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WholesaleOrder;
use App\Models\WholesaleOrderItem;
use App\Models\WholesalePayment;
use App\Models\WholesalePricing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WholesaleOrderController extends Controller
{
    /**
     * Create wholesale order (from prescription or direct order)
     * 
     * POST /api/wholesale-orders/create
     * 
     * Request body:
     * {
     *   "source": "prescription",  // or "direct"
     *   "prescription_id": "RX-20261105-000001",  // if from prescription
     *   "pharmacy_id": "PHARM001",
     *   "wholesaler_id": "WHOLE001",
     *   "items": [
     *     {
     *       "drug_id": "drug_123",
     *       "drug_name": "Amoxicillin",
     *       "quantity": 100,
     *       "unit_price": 50.00
     *     }
     *   ],
     *   "delivery_address": "123 Main St, City",
     *   "payment_method": "bank_transfer"
     * }
     */
    public function createOrder(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'source' => 'required|in:prescription,direct',
                'prescription_id' => 'required_if:source,prescription|string',
                'pharmacy_id' => 'required|string|max:50',
                'wholesaler_id' => 'required|string|max:50',
                'items' => 'required|array|min:1',
                'items.*.drug_id' => 'required|string',
                'items.*.drug_name' => 'required|string',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_price' => 'required|numeric|min:0',
                'delivery_address' => 'required|string',
                'payment_method' => 'required|in:bank_transfer,credit,cash,cheque',
            ]);

            // Calculate total amount
            $totalAmount = collect($validated['items'])->sum(function ($item) {
                return $item['quantity'] * $item['unit_price'];
            });

            // Generate order ID
            $orderId = 'WO-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            // Create order
            $order = WholesaleOrder::create([
                'order_id' => $orderId,
                'prescription_id' => $validated['prescription_id'] ?? null,
                'pharmacy_id' => $validated['pharmacy_id'],
                'wholesaler_id' => $validated['wholesaler_id'],
                'items' => json_encode($validated['items']),
                'total_amount' => $totalAmount,
                'delivery_address' => $validated['delivery_address'],
                'payment_method' => $validated['payment_method'],
                'status' => 'pending',
                'ordered_at' => now(),
            ]);

            // Create line items
            foreach ($validated['items'] as $item) {
                WholesaleOrderItem::create([
                    'wholesale_order_id' => $order->id,
                    'drug_id' => $item['drug_id'],
                    'drug_name' => $item['drug_name'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['quantity'] * $item['unit_price'],
                ]);
            }

            // Initialize payment record
            WholesalePayment::create([
                'wholesale_order_id' => $order->id,
                'amount' => $totalAmount,
                'payment_method' => $validated['payment_method'],
                'status' => 'pending',
            ]);

            Log::info("Wholesale order created: $orderId for pharmacy: {$validated['pharmacy_id']}");

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully',
                'order_id' => $orderId,
                'status' => 'pending',
                'total_amount' => $totalAmount,
                'items_count' => count($validated['items']),
                'created_at' => $order->created_at->toIso8601String(),
            ], 201);

        } catch (\Exception $e) {
            Log::error("Order creation error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to create order',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get order details
     * 
     * GET /api/wholesale-orders/{order_id}
     */
    public function getOrder($orderId): JsonResponse
    {
        try {
            $order = WholesaleOrder::where('order_id', $orderId)
                ->with('items', 'payments')
                ->first();

            if (!$order) {
                return response()->json(['success' => false, 'error' => 'Order not found'], 404);
            }

            return response()->json([
                'success' => true,
                'order' => [
                    'id' => $order->order_id,
                    'pharmacy_id' => $order->pharmacy_id,
                    'wholesaler_id' => $order->wholesaler_id,
                    'status' => $order->status,
                    'total_amount' => $order->total_amount,
                    'payment_method' => $order->payment_method,
                    'delivery_address' => $order->delivery_address,
                    'items' => $order->items()->get(['drug_id', 'drug_name', 'quantity', 'unit_price', 'total_price', 'quantity_received']),
                    'payment' => $order->payments()->latest()->first(['amount', 'status', 'payment_method']),
                    'created_at' => $order->ordered_at,
                    'dispatched_at' => $order->dispatched_at,
                    'delivered_at' => $order->delivered_at,
                    'tracking_number' => $order->tracking_number,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Failed to retrieve order'], 500);
        }
    }

    /**
     * Update order status
     * 
     * POST /api/wholesale-orders/{order_id}/status
     * 
     * Body: {
     *   "status": "confirmed|packed|dispatched|delivered|cancelled",
     *   "notes": "optional notes",
     *   "tracking_number": "TRACK123"
     * }
     */
    public function updateStatus($orderId, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:confirmed,packed,dispatched,delivered,cancelled',
                'notes' => 'nullable|string',
                'tracking_number' => 'nullable|string',
                'delivery_partner' => 'nullable|string',
            ]);

            $order = WholesaleOrder::where('order_id', $orderId)->first();

            if (!$order) {
                return response()->json(['success' => false, 'error' => 'Order not found'], 404);
            }

            // Update based on status
            $updates = ['status' => $validated['status']];

            switch ($validated['status']) {
                case 'confirmed':
                    $updates['confirmed_at'] = now();
                    break;
                case 'dispatched':
                    $updates['dispatched_at'] = now();
                    $updates['delivery_partner'] = $validated['delivery_partner'] ?? null;
                    $updates['tracking_number'] = $validated['tracking_number'] ?? null;
                    break;
                case 'delivered':
                    $updates['delivered_at'] = now();
                    break;
            }

            if ($validated['notes'] ?? null) {
                $updates['notes'] = $validated['notes'];
            }

            $order->update($updates);

            Log::info("Order $orderId status updated to: {$validated['status']}");

            return response()->json([
                'success' => true,
                'message' => 'Order status updated',
                'order_id' => $orderId,
                'status' => $validated['status'],
            ]);

        } catch (\Exception $e) {
            Log::error("Order status update error: " . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to update order'], 500);
        }
    }

    /**
     * Get wholesale prices for drugs
     * 
     * GET /api/wholesale-orders/pricing?wholesaler_id=WHOLE001&drug_ids=drug1,drug2,drug3
     */
    public function getPricing(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'wholesaler_id' => 'required|string',
                'drug_ids' => 'required|string',
            ]);

            $drugIds = explode(',', $validated['drug_ids']);

            $pricing = WholesalePricing::where('wholesaler_id', $validated['wholesaler_id'])
                ->whereIn('drug_id', $drugIds)
                ->where('status', 'active')
                ->where(function ($query) {
                    $query->whereNull('valid_until')
                        ->orWhere('valid_until', '>=', now());
                })
                ->get(['drug_id', 'price', 'minimum_quantity', 'discount_percentage']);

            return response()->json([
                'success' => true,
                'wholesaler_id' => $validated['wholesaler_id'],
                'pricing' => $pricing,
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Failed to get pricing'], 500);
        }
    }

    /**
     * Make payment for order
     * 
     * POST /api/wholesale-orders/{order_id}/payment
     * 
     * Body: {
     *   "amount": 5000.00,
     *   "payment_method": "bank_transfer",
     *   "transaction_reference": "TXN123456",
     *   "notes": "Payment for order"
     * }
     */
    public function makePayment($orderId, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'amount' => 'required|numeric|min:0',
                'payment_method' => 'required|in:bank_transfer,credit,cash,cheque',
                'transaction_reference' => 'nullable|string',
                'notes' => 'nullable|string',
            ]);

            $order = WholesaleOrder::where('order_id', $orderId)->first();

            if (!$order) {
                return response()->json(['success' => false, 'error' => 'Order not found'], 404);
            }

            // Create payment record
            $payment = WholesalePayment::create([
                'wholesale_order_id' => $order->id,
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'status' => 'completed',
                'transaction_reference' => $validated['transaction_reference'] ?? null,
                'payment_date' => now(),
                'notes' => $validated['notes'] ?? null,
            ]);

            Log::info("Payment processed for order $orderId: " . $validated['amount']);

            return response()->json([
                'success' => true,
                'message' => 'Payment recorded',
                'order_id' => $orderId,
                'amount_paid' => $validated['amount'],
                'transaction_reference' => $validated['transaction_reference'],
            ], 201);

        } catch (\Exception $e) {
            Log::error("Payment processing error: " . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to process payment'], 500);
        }
    }

    /**
     * List orders for pharmacy or wholesaler
     * 
     * GET /api/wholesale-orders?pharmacy_id=PHARM001
     * GET /api/wholesale-orders?wholesaler_id=WHOLE001
     */
    public function listOrders(Request $request): JsonResponse
    {
        try {
            $query = WholesaleOrder::query();

            if ($request->has('pharmacy_id')) {
                $query->where('pharmacy_id', $request->input('pharmacy_id'));
            }

            if ($request->has('wholesaler_id')) {
                $query->where('wholesaler_id', $request->input('wholesaler_id'));
            }

            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            $orders = $query->with('items', 'payments')
                ->orderBy('ordered_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $orders,
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => 'Failed to list orders'], 500);
        }
    }
}
