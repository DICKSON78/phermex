<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PharmacyController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $pharmacies = Pharmacy::with('owner')
                ->latest()
                ->paginate(20);

            return response()->json($pharmacies);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch pharmacies.',
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

    public function switchPharmacy($id): JsonResponse
    {
        try {
            $user = Auth::user();
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

            $token = $user->currentAccessToken();
            $token->update(['name' => 'auth-token']);

            return response()->json([
                'message' => 'Switched to pharmacy successfully.',
                'pharmacy' => $pharmacy,
                'user' => $user->load('pharmacy'),
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
