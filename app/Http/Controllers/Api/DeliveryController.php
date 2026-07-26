<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DeliveryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $query = Delivery::with(['order', 'driver'])
                ->when($pharmacyId, fn ($q) => $q->where('pharmacy_id', $pharmacyId));

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            $deliveries = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($deliveries);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch deliveries.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'order_id' => 'required|exists:orders,id',
                'customer_name' => 'required|string|max:255',
                'customer_phone' => 'required|string|max:20',
                'delivery_address' => 'required|string|max:500',
                'delivery_fee' => 'sometimes|numeric|min:0',
                'estimated_arrival' => 'nullable|date',
            ]);

            $order = Order::findOrFail($validated['order_id']);
            $deliveryCode = 'DLV-' . strtoupper(Str::random(8));

            $validated['delivery_code'] = $deliveryCode;
            $validated['status'] = 'pending';

            $delivery = Delivery::create($validated);

            if ($order->order_status !== 'delivered') {
                $order->update(['order_status' => 'confirmed']);
            }

            return response()->json([
                'message' => 'Delivery created successfully.',
                'delivery' => $delivery->load(['order', 'driver']),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create delivery.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $delivery = Delivery::with(['order', 'driver'])->findOrFail($id);

            return response()->json([
                'delivery' => $delivery,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Delivery not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch delivery.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        try {
            $delivery = Delivery::findOrFail($id);

            $validated = $request->validate([
                'status' => 'required|in:pending,assigned,picked_up,in_transit,delivered,failed',
            ]);

            $statusTimestamps = [];

            if ($validated['status'] === 'picked_up') {
                $statusTimestamps['picked_up_at'] = now();
            } elseif ($validated['status'] === 'delivered') {
                $statusTimestamps['actual_arrival'] = now();
            }

            $delivery->update(array_merge($validated, $statusTimestamps));

            if ($validated['status'] === 'delivered') {
                $delivery->order->update(['order_status' => 'delivered']);
            }

            return response()->json([
                'message' => 'Delivery status updated.',
                'delivery' => $delivery->fresh()->load(['order', 'driver']),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Delivery not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update delivery status.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function assignDriver(Request $request, $id): JsonResponse
    {
        try {
            $delivery = Delivery::findOrFail($id);

            $validated = $request->validate([
                'assigned_to' => 'required|exists:users,id',
            ]);

            $delivery->update([
                'assigned_to' => $validated['assigned_to'],
                'status' => 'assigned',
            ]);

            return response()->json([
                'message' => 'Driver assigned successfully.',
                'delivery' => $delivery->fresh()->load(['order', 'driver']),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Delivery not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to assign driver.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
