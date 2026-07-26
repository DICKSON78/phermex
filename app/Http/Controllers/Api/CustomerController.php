<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Customer::query()
                ->when($request->filled('pharmacy_id'), fn ($q) => $q->where('pharmacy_id', $request->input('pharmacy_id')));

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('customer_code', 'like', "%{$search}%");
                });
            }

            $customers = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($customers);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch customers.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'full_name' => 'required|string|max:255',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email',
                'date_of_birth' => 'nullable|date',
                'gender' => 'nullable|in:male,female,other',
                'allergies' => 'nullable|string',
                'medical_conditions' => 'nullable|string',
                'location' => 'nullable|string|max:255',
                'street' => 'nullable|string|max:255',
                'is_guest' => 'sometimes|boolean',
            ]);

            $customerCode = 'CUS-' . strtoupper(Str::random(6));

            $validated['customer_code'] = $customerCode;

            $customer = Customer::create($validated);

            return response()->json([
                'message' => 'Customer created successfully.',
                'customer' => $customer,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create customer.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $customer = Customer::with([
                'orders' => function ($q) {
                    $q->latest()->limit(20);
                },
                'prescriptions' => function ($q) {
                    $q->latest()->limit(20);
                },
            ])->findOrFail($id);

            return response()->json([
                'customer' => $customer,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Customer not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch customer.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $customer = Customer::findOrFail($id);

            $validated = $request->validate([
                'full_name' => 'sometimes|string|max:255',
                'phone' => 'sometimes|nullable|string|max:20',
                'email' => 'sometimes|nullable|email',
                'date_of_birth' => 'sometimes|nullable|date',
                'gender' => 'sometimes|nullable|in:male,female,other',
                'allergies' => 'sometimes|nullable|string',
                'medical_conditions' => 'sometimes|nullable|string',
                'location' => 'sometimes|nullable|string|max:255',
                'street' => 'sometimes|nullable|string|max:255',
            ]);

            $customer->update($validated);

            return response()->json([
                'message' => 'Customer updated successfully.',
                'customer' => $customer->fresh(),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Customer not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update customer.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function prescriptions($id): JsonResponse
    {
        try {
            $customer = Customer::with(['prescriptions.items.drug'])->findOrFail($id);

            return response()->json([
                'customer' => ['id' => $customer->id, 'name' => $customer->full_name],
                'prescriptions' => $customer->prescriptions()->latest()->paginate(20),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Customer not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch prescriptions.', 'error' => $e->getMessage()], 500);
        }
    }

    public function purchaseHistory($id): JsonResponse
    {
        try {
            $customer = Customer::findOrFail($id);

            $orders = $customer->orders()
                ->with('items.drug')
                ->latest()
                ->paginate(20);

            $totalSpent = $customer->orders()
                ->where('payment_status', 'paid')
                ->sum('total');

            $totalOrders = $customer->orders()->count();

            return response()->json([
                'customer' => [
                    'id' => $customer->id,
                    'name' => $customer->full_name,
                    'code' => $customer->customer_code,
                ],
                'summary' => [
                    'total_orders' => $totalOrders,
                    'total_spent' => (float) $totalSpent,
                ],
                'orders' => $orders,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Customer not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch purchase history.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
