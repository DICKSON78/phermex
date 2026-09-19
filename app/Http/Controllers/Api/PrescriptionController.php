<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Drug;
use App\Models\DrugMovement;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PrescriptionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Prescription::with(['customer', 'user', 'items.drug', 'dispenser'])
                ->when($request->filled('pharmacy_id'), fn ($q) => $q->where('pharmacy_id', $request->input('pharmacy_id')));

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            $prescriptions = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($prescriptions);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch prescriptions.',
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
                'doctor_name' => 'required|string|max:255',
                'hospital_name' => 'nullable|string|max:255',
                'diagnosis' => 'nullable|string',
                'notes' => 'nullable|string',
                'items' => 'required|array|min:1',
                'items.*.drug_id' => 'required|exists:drugs,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.dosage' => 'nullable|string|max:255',
                'items.*.frequency' => 'nullable|string|max:255',
                'items.*.duration' => 'nullable|string|max:255',
                'items.*.notes' => 'nullable|string',
            ]);

            $prescriptionCode = 'RX-' . now()->format('Y') . strtoupper(substr(uniqid(), -5));

            DB::beginTransaction();

            $prescription = Prescription::create([
                'pharmacy_id' => $validated['pharmacy_id'],
                'customer_id' => $validated['customer_id'] ?? null,
                'prescription_code' => $prescriptionCode,
                'doctor_name' => $validated['doctor_name'],
                'hospital_name' => $validated['hospital_name'] ?? null,
                'diagnosis' => $validated['diagnosis'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'pending',
            ]);

            foreach ($validated['items'] as $item) {
                $prescription->items()->create([
                    'drug_id' => $item['drug_id'],
                    'quantity' => $item['quantity'],
                    'dosage' => $item['dosage'] ?? null,
                    'frequency' => $item['frequency'] ?? null,
                    'duration' => $item['duration'] ?? null,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Prescription created successfully.',
                'prescription' => $prescription->load(['customer', 'items.drug']),
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
                'message' => 'Failed to create prescription.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $prescription = Prescription::with(['customer', 'user', 'items.drug', 'dispenser'])
                ->findOrFail($id);

            return response()->json([
                'prescription' => $prescription,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Prescription not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch prescription.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function dispense(Request $request, $id): JsonResponse
    {
        try {
            $prescription = Prescription::with('items.drug')->findOrFail($id);

            if ($prescription->status !== 'pending') {
                return response()->json([
                    'message' => 'Only pending prescriptions can be dispensed.',
                ], 422);
            }

            DB::beginTransaction();

            $subtotal = 0;
            $orderItems = [];

            foreach ($prescription->items as $item) {
                $drug = Drug::lockForUpdate()->find($item->drug_id);

                if (!$drug) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "Drug not found for prescription item: {$item->drug_id}.",
                    ], 422);
                }

                if ($drug->quantity < $item->quantity) {
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
                    'pharmacy_id' => $prescription->pharmacy_id,
                    'drug_id' => $drug->id,
                    'movement_type' => 'sale',
                    'quantity' => -$item['quantity'],
                    'unit_cost' => $drug->buying_price,
                    'reference_number' => $prescription->prescription_code,
                    'performed_by' => Auth::id(),
                ]);

                $item->update(['is_dispensed' => true]);
            }

            $orderCode = 'ORD-' . now()->format('Y') . strtoupper(substr(uniqid(), -5));

            $order = Order::create([
                'pharmacy_id' => $prescription->pharmacy_id,
                'customer_id' => $prescription->customer_id,
                'order_code' => $orderCode,
                'order_type' => 'counter',
                'subtotal' => $subtotal,
                'discount' => 0,
                'tax' => 0,
                'total' => $subtotal,
                'payment_method' => 'cash',
                'payment_status' => 'unpaid',
                'order_status' => 'dispensed',
                'notes' => "Dispensed from prescription {$prescription->prescription_code}",
                'processed_by' => Auth::id(),
            ]);

            $order->items()->createMany($orderItems);

            $prescription->update([
                'status' => 'dispensed',
                'dispensed_by' => Auth::id(),
                'dispensed_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Prescription dispensed successfully.',
                'prescription' => $prescription->fresh()->load(['customer', 'items.drug', 'dispenser']),
                'order' => $order->load(['items.drug']),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            DB::rollBack();
            return response()->json(['message' => 'Prescription not found.'], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to dispense prescription.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function process(Request $request, $id): JsonResponse
    {
        try {
            $prescription = Prescription::with('items.drug')->findOrFail($id);

            if ($prescription->status !== 'pending') {
                return response()->json([
                    'message' => 'Only pending prescriptions can be processed.',
                ], 422);
            }

            $validated = $request->validate([
                'items' => 'required|array|min:1',
                'items.*.drug_id' => 'required|exists:drugs,id',
                'items.*.quantity' => 'required|integer|min:1',
                'total' => 'sometimes|nullable|numeric|min:0',
            ]);

            DB::beginTransaction();

            $pharmacy = $prescription->pharmacy_id;

            $subtotal = 0;
            $orderItems = [];

            foreach ($validated['items'] as $item) {
                $drug = Drug::lockForUpdate()
                    ->where('id', $item['drug_id'])
                    ->where('pharmacy_id', $pharmacy)
                    ->first();

                if (!$drug) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "Drug ID {$item['drug_id']} does not belong to this pharmacy.",
                    ], 422);
                }

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
                    'pharmacy_id' => $pharmacy,
                    'drug_id' => $drug->id,
                    'movement_type' => 'sale',
                    'quantity' => -$item['quantity'],
                    'unit_cost' => $drug->buying_price,
                    'reference_number' => $prescription->prescription_code,
                    'performed_by' => Auth::id(),
                ]);
            }

            $orderTotal = $validated['total'] ?? $subtotal;
            $orderCode = 'ORD-' . now()->format('Y') . strtoupper(substr(uniqid(), -5));

            $order = Order::create([
                'pharmacy_id' => $pharmacy,
                'user_id' => $prescription->user_id,
                'customer_id' => $prescription->customer_id,
                'order_code' => $orderCode,
                'order_type' => 'prescription',
                'subtotal' => $subtotal,
                'discount' => 0,
                'tax' => 0,
                'total' => $orderTotal,
                'payment_method' => 'cash',
                'payment_status' => 'unpaid',
                'order_status' => 'dispensed',
                'notes' => "Dispensed from prescription {$prescription->prescription_code}",
                'processed_by' => Auth::id(),
            ]);

            $order->items()->createMany($orderItems);

            $prescription->update([
                'status' => 'dispensed',
                'dispensed_by' => Auth::id(),
                'dispensed_at' => now(),
            ]);

            if ($prescription->user_id) {
                Notification::create([
                    'pharmacy_id' => $prescription->pharmacy_id,
                    'user_id' => $prescription->user_id,
                    'title' => 'Prescription Ready',
                    'message' => "Your prescription {$prescription->prescription_code} has been processed. Order #{$order->order_code} is ready.",
                    'type' => 'info',
                    'is_read' => false,
                    'link' => "/orders/{$order->id}",
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Prescription processed successfully.',
                'prescription' => $prescription->fresh()->load(['customer', 'user', 'items.drug', 'dispenser']),
                'order' => $order->load(['items.drug', 'user']),
            ], 201);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            DB::rollBack();
            return response()->json(['message' => 'Prescription not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to process prescription.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function cancel(Request $request, $id): JsonResponse
    {
        try {
            $prescription = Prescription::findOrFail($id);

            if (!in_array($prescription->status, ['pending'])) {
                return response()->json(['message' => 'Only pending prescriptions can be cancelled.'], 422);
            }

            $prescription->update(['status' => 'cancelled']);

            return response()->json([
                'message' => 'Prescription cancelled.',
                'prescription' => $prescription->fresh()->load(['customer', 'items.drug']),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Prescription not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to cancel prescription.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function searchByDoctor(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'doctor_name' => 'required|string|min:1',
            ]);

            $prescriptions = Prescription::where('pharmacy_id', $request->input('pharmacy_id'))
                ->where('doctor_name', 'like', "%{$request->input('doctor_name')}%")
                ->with(['customer', 'user', 'items.drug', 'dispenser'])
                ->latest()
                ->paginate(20);

            return response()->json($prescriptions);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to search prescriptions.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
