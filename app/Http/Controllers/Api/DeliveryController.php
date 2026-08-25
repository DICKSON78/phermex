<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DeliveryController extends Controller
{
    public function drivers(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $drivers = \App\Models\User::where('role', 'delivery')
                ->where('is_active', true)
                ->when($pharmacyId, fn ($q) => $q->whereHas('pharmacy', fn ($p) => $p->where('pharmacies.id', $pharmacyId)))
                ->orderBy('name')
                ->get(['id', 'name', 'phone', 'email']);

            return response()->json(['drivers' => $drivers]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch drivers.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $query = Delivery::with(['order', 'driver'])
                ->when($pharmacyId, fn ($q) => $q->where('pharmacy_id', $pharmacyId));

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->input('date_from'));
            }

            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->input('date_to'));
            }

            if ($request->filled('assigned_to')) {
                $query->where('assigned_to', $request->input('assigned_to'));
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

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $delivery = Delivery::findOrFail($id);

            $validated = $request->validate([
                'customer_name' => 'sometimes|string|max:255',
                'customer_phone' => 'sometimes|string|max:20',
                'delivery_address' => 'sometimes|string|max:500',
                'delivery_fee' => 'sometimes|numeric|min:0',
                'estimated_arrival' => 'nullable|date',
            ]);

            $delivery->update($validated);

            return response()->json([
                'message' => 'Delivery updated successfully.',
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
                'message' => 'Failed to update delivery.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        try {
            $delivery = Delivery::findOrFail($id);

            $validated = $request->validate([
                'status' => 'required|in:pending,assigned,picked_up,in_transit,out_for_delivery,delivered,failed',
            ]);

            $statusTimestamps = [];

            if ($validated['status'] === 'picked_up' || $validated['status'] === 'out_for_delivery') {
                $statusTimestamps['picked_up_at'] = now();
            } elseif ($validated['status'] === 'delivered') {
                $statusTimestamps['actual_arrival'] = now();
            }

            $delivery->update(array_merge($validated, $statusTimestamps));

            if ($validated['status'] === 'delivered') {
                $delivery->order->update(['order_status' => 'delivered']);
            } elseif ($validated['status'] === 'out_for_delivery') {
                $delivery->order->update(['order_status' => 'out_for_delivery']);
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
