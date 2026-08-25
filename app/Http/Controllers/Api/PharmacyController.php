<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class PharmacyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if ($user->isAdmin()) {
                $pharmacies = Pharmacy::with('owner')->latest()->paginate(20);

                return response()->json($pharmacies);
            }

            $pharmacies = $user->accessiblePharmacies();

            return response()->json([
                'data' => $pharmacies,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch pharmacies.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user->isOwner()) {
                return response()->json([
                    'message' => 'Only pharmacy owners can create pharmacies.',
                ], 403);
            }

            $validated = $request->validate([
                'pharmacy_name' => 'required|string|max:255',
                'pharmacy_type' => 'sometimes|in:independent,chain,hospital,online',
                'license_number' => 'sometimes|nullable|string|max:255',
                'license_expiry' => 'sometimes|nullable|date',
                'country' => 'sometimes|string|max:100',
                'region' => 'required|string|max:255',
                'district' => 'required|string|max:255',
                'ward' => 'sometimes|nullable|string|max:255',
                'street' => 'sometimes|nullable|string|max:255',
                'latitude' => 'sometimes|nullable|numeric|between:-90,90',
                'longitude' => 'sometimes|nullable|numeric|between:-180,180',
                'opening_capital' => 'sometimes|nullable|numeric|min:0',
                'working_days' => 'sometimes|nullable|array',
                'working_hours' => 'sometimes|nullable|array',
                'description' => 'sometimes|nullable|string|max:1000',
                'subscription_plan_id' => 'required|exists:subscription_plans,id',
            ]);

            $pharmacy = Pharmacy::create([
                'owner_id' => $user->id,
                'pharmacy_name' => $validated['pharmacy_name'],
                'pharmacy_code' => 'PHM-' . strtoupper(Str::random(6)),
                'pharmacy_type' => $validated['pharmacy_type'] ?? 'independent',
                'license_number' => $validated['license_number'] ?? null,
                'license_expiry' => $validated['license_expiry'] ?? null,
                'country' => $validated['country'] ?? 'Tanzania',
                'region' => $validated['region'],
                'district' => $validated['district'],
                'ward' => $validated['ward'] ?? null,
                'street' => $validated['street'] ?? null,
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'phone' => $user->phone,
                'email' => $user->email,
                'description' => $validated['description'] ?? null,
                'working_days' => $validated['working_days'] ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                'working_hours' => $validated['working_hours'] ?? ['open' => '08:00', 'close' => '18:00'],
                'opening_capital' => $validated['opening_capital'] ?? 0,
                'status' => 'pending',
                'application_status' => 'pending',
                'is_published' => false,
                'subscription_plan_id' => $validated['subscription_plan_id'],
                'subscription_amount' => \App\Models\SubscriptionPlan::find($validated['subscription_plan_id'])?->price,
                'payment_status' => 'unpaid',
            ]);

            $user->pharmacy()->attach($pharmacy->id);

            return response()->json([
                'message' => 'Pharmacy created successfully. Awaiting approval.',
                'pharmacy' => $pharmacy,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create pharmacy.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $pharmacy = Pharmacy::with('owner', 'drugs', 'customers', 'pharmacists')
                ->findOrFail($id);

            return response()->json([
                'pharmacy' => $pharmacy,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch pharmacy.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $pharmacy = Pharmacy::findOrFail($id);

            $validated = $request->validate([
                'pharmacy_name' => 'sometimes|string|max:255',
                'pharmacy_logo' => 'sometimes|nullable|string|max:255',
                'license_number' => 'sometimes|nullable|string|max:255',
                'license_expiry' => 'sometimes|nullable|date',
                'pharmacy_type' => 'sometimes|in:independent,chain,hospital,online',
                'business_category' => 'sometimes|nullable|string|max:255',
                'country' => 'sometimes|string|max:100',
                'region' => 'sometimes|nullable|string|max:255',
                'district' => 'sometimes|nullable|string|max:255',
                'ward' => 'sometimes|nullable|string|max:255',
                'street' => 'sometimes|nullable|string|max:255',
                'phone' => 'sometimes|nullable|string|max:20',
                'email' => 'sometimes|nullable|email',
                'working_days' => 'sometimes|nullable|array',
                'working_hours' => 'sometimes|nullable|array',
                'opening_capital' => 'sometimes|numeric|min:0',
                'status' => 'sometimes|in:pending,active,suspended,closed',
                'is_published' => 'sometimes|boolean',
            ]);

            $pharmacy->update($validated);

            return response()->json([
                'message' => 'Pharmacy updated successfully.',
                'pharmacy' => $pharmacy->fresh(),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update pharmacy.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function stats($id): JsonResponse
    {
        try {
            $pharmacy = Pharmacy::findOrFail($id);

            $totalDrugs = $pharmacy->drugs()->count();
            $totalOrders = $pharmacy->orders()->count();
            $totalCustomers = $pharmacy->customers()->count();
            $totalRevenue = $pharmacy->orders()
                ->where('payment_status', 'paid')
                ->sum('total');
            $lowStockCount = $pharmacy->drugs()
                ->whereColumn('quantity', '<=', 'reorder_level')
                ->count();
            $expiringSoonCount = $pharmacy->drugs()
                ->whereBetween('expiry_date', [now(), now()->addDays(30)])
                ->count();

            return response()->json([
                'pharmacy' => [
                    'id' => $pharmacy->id,
                    'name' => $pharmacy->pharmacy_name,
                    'code' => $pharmacy->pharmacy_code,
                ],
                'stats' => [
                    'total_drugs' => $totalDrugs,
                    'total_orders' => $totalOrders,
                    'total_customers' => $totalCustomers,
                    'total_revenue' => (float) $totalRevenue,
                    'low_stock_count' => $lowStockCount,
                    'expiring_soon_count' => $expiringSoonCount,
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch pharmacy stats.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function current(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $pharmacyId = $user->resolveCurrentPharmacyId();

            $pharmacy = $pharmacyId ? Pharmacy::find($pharmacyId) : null;

            if (!$pharmacy) {
                return response()->json(['message' => 'No pharmacy associated with this account.'], 404);
            }

            return response()->json($pharmacy);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch current pharmacy.', 'error' => $e->getMessage()], 500);
        }
    }

    public function switchPharmacy(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            $pharmacy = Pharmacy::findOrFail($id);

            if ($user->isOwner()) {
                $hasAccess = $pharmacy->owner_id === $user->id
                    || $user->pharmacy()->where('pharmacies.id', $id)->exists();
            } else {
                $hasAccess = $user->pharmacy()->where('pharmacies.id', $id)->exists();
            }

            if (!$hasAccess) {
                return response()->json([
                    'message' => 'You do not have access to this pharmacy.',
                ], 403);
            }

            $user->update(['current_pharmacy_id' => $id]);
            $user->refresh();
            $user->load('pharmacy', 'currentPharmacy');
            $user->accessible_pharmacies = $user->accessiblePharmacies();

            return response()->json([
                'message' => 'Switched to pharmacy successfully.',
                'pharmacy' => $pharmacy,
                'user' => $user,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to switch pharmacy.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
