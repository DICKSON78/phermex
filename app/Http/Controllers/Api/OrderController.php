<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Drug;
use App\Models\DrugMovement;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Order::with(['customer', 'items.drug', 'processor', 'user'])
                ->when($request->filled('pharmacy_id'), fn ($q) => $q->where('pharmacy_id', $request->input('pharmacy_id')));

            if ($request->filled('status')) {
                $query->where('order_status', $request->input('status'));
            }

            if ($request->filled('payment_status')) {
                $query->where('payment_status', $request->input('payment_status'));
            }

            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->input('date_from'));
            }

            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->input('date_to'));
            }

            $orders = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($orders);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch orders.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'customer_id' => 'nullable|exists:customers,id',
                'order_type' => 'sometimes|in:counter,online,phone',
                'items' => 'required|array|min:1',
                'items.*.drug_id' => 'required|exists:drugs,id',
                'items.*.quantity' => 'required|integer|min:1',
                'discount' => 'sometimes|numeric|min:0',
                'tax' => 'sometimes|numeric|min:0',
                'payment_method' => 'sometimes|in:cash,card,mobile,bank',
                'payment_status' => 'sometimes|in:unpaid,partial,paid',
                'notes' => 'nullable|string',
            ]);

            $orderCode = 'ORD-' . now()->format('Y') . strtoupper(substr(uniqid(), -5));

            DB::beginTransaction();

            $subtotal = 0;
            $orderItems = [];

            foreach ($validated['items'] as $item) {
                $drug = Drug::lockForUpdate()->findOrFail($item['drug_id']);

                if ($drug->quantity < $item['quantity']) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "Insufficient stock for '{$drug->name}'. Available: {$drug->quantity}.",
                    ], 422);
                }

                $unitPrice = $drug->selling_price;
                $totalPrice = $unitPrice * $item['quantity'];
                $subtotal += $totalPrice;

                $orderItems[] = [
                    'drug_id' => $drug->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $unitPrice,
                    'total_price' => $totalPrice,
                ];

                $drug->decrement('quantity', $item['quantity']);

                DrugMovement::create([
                    'pharmacy_id' => $validated['pharmacy_id'],
                    'drug_id' => $drug->id,
                    'movement_type' => 'sale',
                    'quantity' => -$item['quantity'],
                    'unit_cost' => $drug->buying_price,
                    'reference_number' => $orderCode,
                    'performed_by' => Auth::id(),
                ]);
            }

            $discount = $validated['discount'] ?? 0;
            $tax = $validated['tax'] ?? 0;
            $total = $subtotal - $discount + $tax;

            $order = Order::create([
                'pharmacy_id' => $validated['pharmacy_id'],
                'customer_id' => $validated['customer_id'] ?? null,
                'order_code' => $orderCode,
                'order_type' => $validated['order_type'] ?? 'counter',
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'total' => $total,
                'payment_method' => $validated['payment_method'] ?? 'cash',
                'payment_status' => $validated['payment_status'] ?? 'unpaid',
                'order_status' => 'pending',
                'notes' => $validated['notes'] ?? null,
                'processed_by' => Auth::id(),
            ]);

            $order->items()->createMany($orderItems);

            DB::commit();

            return response()->json([
                'message' => 'Order created successfully.',
                'order' => $order->load(['items.drug', 'customer', 'processor']),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create order.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $order = Order::with(['customer', 'items.drug', 'processor', 'user'])
                ->findOrFail($id);

            return response()->json([
                'order' => $order,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Order not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch order.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        try {
            $order = Order::with('user')->findOrFail($id);

            $validated = $request->validate([
                'order_status' => 'required|in:pending,confirmed,preparing,ready,out_for_delivery,delivered,dispensed,cancelled',
                'payment_status' => 'sometimes|in:unpaid,partial,paid',
                'payment_method' => 'sometimes|in:cash,card,mobile,bank',
            ]);

            $oldStatus = $order->order_status;
            $newStatus = $validated['order_status'];

            $statusLabels = [
                'pending' => 'Pending',
                'confirmed' => 'Confirmed',
                'preparing' => 'Preparing',
                'ready' => 'Ready for Pickup',
                'out_for_delivery' => 'Out for Delivery',
                'delivered' => 'Delivered',
                'dispensed' => 'Dispensed',
                'cancelled' => 'Cancelled',
            ];

            if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
                DB::beginTransaction();

                foreach ($order->items as $item) {
                    Drug::where('id', $item->drug_id)->increment('quantity', $item->quantity);

                    DrugMovement::create([
                        'pharmacy_id' => $order->pharmacy_id,
                        'drug_id' => $item->drug_id,
                        'movement_type' => 'return',
                        'quantity' => $item->quantity,
                        'unit_cost' => $item->unit_price,
                        'reference_number' => $order->order_code,
                        'notes' => 'Order cancelled - stock restored',
                        'performed_by' => Auth::id(),
                    ]);
                }

                $order->update($validated);

                DB::commit();
            } else {
                $order->update($validated);
            }

            if ($order->user_id && $newStatus !== $oldStatus) {
                Notification::create([
                    'pharmacy_id' => $order->pharmacy_id,
                    'user_id' => $order->user_id,
                    'title' => 'Order ' . ($statusLabels[$newStatus] ?? $newStatus),
                    'message' => "Your order #{$order->order_code} is now " . ($statusLabels[$newStatus] ?? $newStatus),
                    'type' => $newStatus === 'cancelled' ? 'danger' : ($newStatus === 'delivered' ? 'success' : 'info'),
                    'is_read' => false,
                    'link' => "/orders/{$order->id}",
                ]);
            }

            return response()->json([
                'message' => 'Order status updated successfully.',
                'order' => $order->fresh()->load(['items.drug', 'customer', 'processor']),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Order not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update order status.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function dailyReport($pharmacyId): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user->pharmacies()->where('pharmacies.id', $pharmacyId)->exists()) {
                return response()->json(['message' => 'You do not have access to this pharmacy.'], 403);
            }

            $today = now()->toDateString();

            $orders = Order::where('pharmacy_id', $pharmacyId)
                ->whereDate('created_at', $today);

            $totalOrders = (clone $orders)->count();
            $totalRevenue = (clone $orders)
                ->where('payment_status', 'paid')
                ->sum('total');
            $pendingOrders = (clone $orders)
                ->where('order_status', 'pending')
                ->count();
            $completedOrders = (clone $orders)
                ->where('order_status', 'dispensed')
                ->count();
            $cancelledOrders = (clone $orders)
                ->where('order_status', 'cancelled')
                ->count();

            $topDrugs = OrderItem::whereHas('order', function ($q) use ($pharmacyId, $today) {
                $q->where('pharmacy_id', $pharmacyId)->whereDate('created_at', $today);
            })
                ->select('drug_id', DB::raw('SUM(quantity) as total_quantity'), DB::raw('SUM(total_price) as total_revenue'))
                ->groupBy('drug_id')
                ->with('drug:id,name')
                ->orderByDesc('total_quantity')
                ->limit(10)
                ->get();

            $paymentBreakdown = (clone $orders)
                ->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(total) as total'))
                ->groupBy('payment_method')
                ->get();

            return response()->json([
                'date' => $today,
                'summary' => [
                    'total_orders' => $totalOrders,
                    'total_revenue' => (float) $totalRevenue,
                    'pending_orders' => $pendingOrders,
                    'completed_orders' => $completedOrders,
                    'cancelled_orders' => $cancelledOrders,
                ],
                'top_drugs' => $topDrugs,
                'payment_breakdown' => $paymentBreakdown,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate daily report.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
