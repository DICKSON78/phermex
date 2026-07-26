<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Drug;
use App\Models\Expense;
use App\Models\Order;
use App\Models\Pharmacy;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        try {
            $totalPharmacies = Pharmacy::count();
            $newPharmaciesThisMonth = Pharmacy::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();
            $totalUsers = User::count();
            $activeSubscriptions = Pharmacy::where('status', 'active')->count();
            $platformRevenue = (float) Order::where('payment_status', 'paid')->sum('total');

            $revenueChart = Order::where('payment_status', 'paid')
                ->where('created_at', '>=', now()->subDays(30))
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('SUM(total) as revenue')
                )
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            $recentPharmacies = Pharmacy::with('owner')
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->pharmacy_name,
                    'owner' => $p->owner?->name,
                    'status' => $p->status,
                    'joined' => $p->created_at->format('Y-m-d'),
                ]);

            $subscriptionBreakdown = Pharmacy::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();

            return response()->json([
                'totalPharmacies' => $totalPharmacies,
                'newPharmaciesThisMonth' => $newPharmaciesThisMonth,
                'totalUsers' => $totalUsers,
                'activeSubscriptions' => $activeSubscriptions,
                'platformRevenue' => $platformRevenue,
                'revenueChart' => $revenueChart,
                'recentPharmacies' => $recentPharmacies,
                'subscriptionBreakdown' => $subscriptionBreakdown,
                'recentActivity' => [],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch admin dashboard.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function listPharmacies(Request $request): JsonResponse
    {
        try {
            $query = Pharmacy::with('owner');

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('pharmacy_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('pharmacy_code', 'like', "%{$search}%");
                });
            }

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            $pharmacies = $query->latest()->get();

            $results = $pharmacies->map(function ($pharmacy) {
                $revenue = $pharmacy->orders()
                    ->where('payment_status', 'paid')
                    ->sum('total');

                $daysRemaining = null;
                if ($pharmacy->subscription_end_date) {
                    $daysRemaining = max(0, now()->diffInDays($pharmacy->subscription_end_date, false));
                } elseif ($pharmacy->trial_ends_at) {
                    $daysRemaining = max(0, now()->diffInDays($pharmacy->trial_ends_at, false));
                }

                return [
                    'id' => $pharmacy->id,
                    'pharmacy_name' => $pharmacy->pharmacy_name,
                    'pharmacy_code' => $pharmacy->pharmacy_code,
                    'owner' => $pharmacy->owner ? [
                        'id' => $pharmacy->owner->id,
                        'name' => $pharmacy->owner->name,
                        'email' => $pharmacy->owner->email,
                    ] : null,
                    'country' => $pharmacy->country,
                    'region' => $pharmacy->region,
                    'district' => $pharmacy->district,
                    'phone' => $pharmacy->phone,
                    'email' => $pharmacy->email,
                    'status' => $pharmacy->status,
                    'application_status' => $pharmacy->application_status,
                    'payment_status' => $pharmacy->payment_status,
                    'subscription_type' => $pharmacy->subscription_type ?? 'trial',
                    'days_remaining' => $daysRemaining,
                    'created_at' => $pharmacy->created_at->toISOString(),
                    'drugs_count' => $pharmacy->drugs()->count(),
                    'revenue' => (float) $revenue,
                ];
            });

            return response()->json(['data' => $results]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch pharmacies.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function pharmacyDetail($id): JsonResponse
    {
        try {
            $pharmacy = Pharmacy::with('owner', 'subscriptionPlan')
                ->withCount(['drugs', 'orders', 'customers', 'pharmacists'])
                ->findOrFail($id);

            $monthlyRevenue = $pharmacy->orders()
                ->where('payment_status', 'paid')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('total');

            $totalRevenue = $pharmacy->orders()
                ->where('payment_status', 'paid')
                ->sum('total');

            $lastOrder = $pharmacy->orders()
                ->latest('created_at')
                ->value('created_at');

            $daysRemaining = null;
            if ($pharmacy->subscription_end_date) {
                $daysRemaining = max(0, now()->diffInDays($pharmacy->subscription_end_date, false));
            } elseif ($pharmacy->trial_ends_at) {
                $daysRemaining = max(0, now()->diffInDays($pharmacy->trial_ends_at, false));
            }

            $subscriptionType = 'none';
            if ($pharmacy->subscription_end_date && now()->lte($pharmacy->subscription_end_date)) {
                $subscriptionType = 'subscription';
            } elseif ($pharmacy->trial_ends_at && now()->lte($pharmacy->trial_ends_at)) {
                $subscriptionType = 'trial';
            } elseif (($pharmacy->subscription_end_date && now()->gt($pharmacy->subscription_end_date)) || ($pharmacy->trial_ends_at && now()->gt($pharmacy->trial_ends_at))) {
                $subscriptionType = 'expired';
            }

            $data = [
                'id' => $pharmacy->id,
                'pharmacy_name' => $pharmacy->pharmacy_name,
                'pharmacy_code' => $pharmacy->pharmacy_code,
                'pharmacy_logo' => $pharmacy->pharmacy_logo,
                'license_number' => $pharmacy->license_number,
                'license_expiry' => $pharmacy->license_expiry,
                'pharmacy_type' => $pharmacy->pharmacy_type,
                'business_category' => $pharmacy->business_category,
                'country' => $pharmacy->country,
                'region' => $pharmacy->region,
                'district' => $pharmacy->district,
                'ward' => $pharmacy->ward,
                'street' => $pharmacy->street,
                'city' => $pharmacy->district,
                'phone' => $pharmacy->phone,
                'email' => $pharmacy->email,
                'website' => $pharmacy->website,
                'latitude' => $pharmacy->latitude,
                'longitude' => $pharmacy->longitude,
                'working_days' => $pharmacy->working_days,
                'working_hours' => $pharmacy->working_hours,
                'opening_capital' => $pharmacy->opening_capital,
                'status' => $pharmacy->status,
                'is_published' => $pharmacy->is_published,
                'description' => $pharmacy->description,
                'application_status' => $pharmacy->application_status,
                'subscription_plan_id' => $pharmacy->subscription_plan_id,
                'subscription_amount' => $pharmacy->subscription_amount,
                'payment_status' => $pharmacy->payment_status,
                'subscription_start_date' => $pharmacy->subscription_start_date?->toISOString(),
                'subscription_end_date' => $pharmacy->subscription_end_date?->toISOString(),
                'trial_ends_at' => $pharmacy->trial_ends_at?->toISOString(),
                'rejection_reason' => $pharmacy->rejection_reason,
                'created_at' => $pharmacy->created_at->toISOString(),
                'updated_at' => $pharmacy->updated_at->toISOString(),
                'owner' => $pharmacy->owner ? [
                    'id' => $pharmacy->owner->id,
                    'name' => $pharmacy->owner->name,
                    'email' => $pharmacy->owner->email,
                    'phone' => $pharmacy->owner->phone,
                ] : null,
                'subscription_plan' => $pharmacy->subscriptionPlan ? [
                    'id' => $pharmacy->subscriptionPlan->id,
                    'name' => $pharmacy->subscriptionPlan->name,
                    'slug' => $pharmacy->subscriptionPlan->slug,
                    'price' => (float) $pharmacy->subscriptionPlan->price,
                    'duration_months' => $pharmacy->subscriptionPlan->duration_months,
                ] : null,
                'subscription_type' => $subscriptionType,
                'days_remaining' => $daysRemaining,
                'drugs_count' => $pharmacy->drugs_count,
                'orders_count' => $pharmacy->orders_count,
                'customers_count' => $pharmacy->customers_count,
                'pharmacists_count' => $pharmacy->pharmacists_count,
                'employees_count' => ($pharmacy->pharmacists_count ?? 0) + 1,
                'monthly_revenue' => (float) $monthlyRevenue,
                'total_revenue' => (float) $totalRevenue,
                'last_order' => $lastOrder,
            ];

            return response()->json(['data' => $data]);
        } catch (\Illuminate\Database\ModelNotFoundException $e) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch pharmacy details.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function listUsers(Request $request): JsonResponse
    {
        try {
            $query = User::with('pharmacy');

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('user_code', 'like', "%{$search}%");
                });
            }

            if ($request->filled('role')) {
                $query->where('role', $request->input('role'));
            }

            if ($request->filled('status')) {
                $query->where('is_active', $request->input('status') === 'active');
            }

            $users = $query->latest()->get();

            $results = $users->map(function ($user) {
                $pharmacyNames = $user->pharmacy->pluck('pharmacy_name')->implode(', ');

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'code' => $user->user_code,
                    'status' => $user->is_active ? 'active' : 'inactive',
                    'pharmacy' => $pharmacyNames ?: null,
                    'joined' => $user->created_at->format('Y-m-d'),
                ];
            });

            return response()->json(['data' => $results]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch users.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function updatePharmacyStatus(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:active,suspended',
            ]);

            $pharmacy = Pharmacy::findOrFail($id);
            $pharmacy->update(['status' => $validated['status']]);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'pharmacy_status_updated',
                'auditable_type' => Pharmacy::class,
                'auditable_id' => $pharmacy->id,
                'details' => [
                    'old_status' => $pharmacy->getOriginal('status'),
                    'new_status' => $validated['status'],
                ],
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Pharmacy status updated.',
                'pharmacy' => $pharmacy,
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
                'message' => 'Failed to update pharmacy status.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function toggleUserActive(Request $request, $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            $user->update(['is_active' => !$user->is_active]);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'user_active_toggled',
                'auditable_type' => User::class,
                'auditable_id' => $user->id,
                'details' => [
                    'new_status' => $user->is_active ? 'active' : 'inactive',
                ],
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'User status toggled.',
                'user' => $user,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'User not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to toggle user status.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function auditLogs(Request $request): JsonResponse
    {
        try {
            $query = AuditLog::with('user');

            if ($request->filled('action')) {
                $query->where('action', $request->input('action'));
            }

            if ($request->filled('user_id')) {
                $query->where('user_id', $request->input('user_id'));
            }

            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->input('date_from'));
            }

            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->input('date_to'));
            }

            $logs = $query->latest()->paginate($request->input('per_page', 50));

            return response()->json($logs);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch audit logs.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function approvePharmacy(Request $request, $id): JsonResponse
    {
        try {
            $pharmacy = Pharmacy::findOrFail($id);
            $pharmacy->update([
                'application_status' => 'approved',
                'status' => 'active',
            ]);

            return response()->json([
                'message' => 'Pharmacy approved successfully.',
                'pharmacy' => $pharmacy->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to approve pharmacy.', 'error' => $e->getMessage()], 500);
        }
    }

    public function rejectPharmacy(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'rejection_reason' => 'required|string|max:1000',
            ]);

            $pharmacy = Pharmacy::findOrFail($id);
            $pharmacy->update([
                'application_status' => 'rejected',
                'status' => 'inactive',
                'rejection_reason' => $validated['rejection_reason'],
            ]);

            return response()->json([
                'message' => 'Pharmacy rejected.',
                'pharmacy' => $pharmacy->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to reject pharmacy.', 'error' => $e->getMessage()], 500);
        }
    }

    public function confirmPayment(Request $request, $id): JsonResponse
    {
        try {
            $pharmacy = Pharmacy::findOrFail($id);

            if (!$pharmacy->subscription_plan_id) {
                return response()->json(['message' => 'No subscription plan selected.'], 400);
            }

            $pharmacy->update([
                'payment_status' => 'paid',
                'status' => 'active',
                'is_published' => true,
            ]);

            return response()->json([
                'message' => 'Payment confirmed. Subscription activated.',
                'pharmacy' => $pharmacy->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to confirm payment.', 'error' => $e->getMessage()], 500);
        }
    }

    public function listPendingPharmacies(Request $request): JsonResponse
    {
        try {
            $query = Pharmacy::with(['owner', 'subscriptionPlan']);

            if ($request->filled('status') && $request->input('status') !== 'all') {
                $query->where('application_status', $request->input('status'));
            }

            $pharmacies = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($pharmacies);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch pharmacies.', 'error' => $e->getMessage()], 500);
        }
    }
}
