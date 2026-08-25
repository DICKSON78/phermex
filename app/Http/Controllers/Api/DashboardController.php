<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Drug;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Pharmacy;
use App\Models\Prescription;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function ownerDashboard(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $pharmacyIds = $user->isOwner()
                ? Pharmacy::where('owner_id', $user->id)->pluck('id')
                : $user->pharmacy()->pluck('pharmacies.id');

            $today = now()->toDateString();
            $monthStart = now()->startOfMonth();

            $todaySales = Order::whereIn('pharmacy_id', $pharmacyIds)
                ->whereDate('created_at', $today)
                ->where('payment_status', 'paid')
                ->sum('total');

            $monthlyRevenue = Order::whereIn('pharmacy_id', $pharmacyIds)
                ->where('created_at', '>=', $monthStart)
                ->where('payment_status', 'paid')
                ->sum('total');

            $ordersToday = Order::whereIn('pharmacy_id', $pharmacyIds)
                ->whereDate('created_at', $today)
                ->count();

            $activePrescriptions = Prescription::whereIn('pharmacy_id', $pharmacyIds)
                ->where('status', 'pending')
                ->count();

            $lowStockAlerts = Drug::whereIn('pharmacy_id', $pharmacyIds)
                ->whereColumn('quantity', '<=', 'reorder_level')
                ->count();

            $expiringDrugs = Drug::whereIn('pharmacy_id', $pharmacyIds)
                ->whereBetween('expiry_date', [now(), now()->addDays(30)])
                ->count();

            $revenueChart = Order::whereIn('pharmacy_id', $pharmacyIds)
                ->where('payment_status', 'paid')
                ->where('created_at', '>=', now()->subDays(7))
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('SUM(total) as revenue')
                )
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            $topSellingDrugs = OrderItem::whereHas('order', function ($q) use ($pharmacyIds) {
                $q->whereIn('pharmacy_id', $pharmacyIds)
                    ->where('created_at', '>=', now()->subDays(30));
            })
                ->select('drug_id', DB::raw('SUM(quantity) as total_sold'), DB::raw('SUM(total_price) as revenue'))
                ->groupBy('drug_id')
                ->with('drug:id,name')
                ->orderByDesc('total_sold')
                ->limit(10)
                ->get();

            $lastWeekSales = (float) Order::whereIn('pharmacy_id', $pharmacyIds)
                ->where('payment_status', 'paid')
                ->whereBetween('created_at', [now()->subDays(14), now()->subDays(7)])
                ->sum('total');
            $prevWeekSales = (float) Order::whereIn('pharmacy_id', $pharmacyIds)
                ->where('payment_status', 'paid')
                ->whereBetween('created_at', [now()->subDays(21), now()->subDays(14)])
                ->sum('total');
            $salesTrend = $prevWeekSales > 0
                ? round((($lastWeekSales - $prevWeekSales) / $prevWeekSales) * 100, 1)
                : 0;

            $recentOrders = Order::whereIn('pharmacy_id', $pharmacyIds)
                ->with('customer')
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn ($o) => [
                    'id' => $o->id,
                    'order_code' => $o->order_code,
                    'customer' => $o->customer?->name ?? 'Walk-in',
                    'total' => (float) $o->total,
                    'status' => $o->order_status,
                    'time' => $o->created_at->format('h:i A'),
                ]);

            $lowStockDrugs = Drug::whereIn('pharmacy_id', $pharmacyIds)
                ->whereColumn('quantity', '<=', 'reorder_level')
                ->orderBy('quantity')
                ->limit(8)
                ->get(['name', 'quantity', 'reorder_level']);

            return response()->json([
                'today_sales' => (float) $todaySales,
                'monthly_revenue' => (float) $monthlyRevenue,
                'orders_today' => $ordersToday,
                'active_prescriptions' => $activePrescriptions,
                'low_stock_alerts' => $lowStockAlerts,
                'expiring_drugs' => $expiringDrugs,
                'sales_trend' => $salesTrend,
                'revenue_chart' => $revenueChart,
                'top_selling_drugs' => $topSellingDrugs,
                'recent_orders' => $recentOrders,
                'low_stock_drugs' => $lowStockDrugs,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch owner dashboard.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function adminDashboard(): JsonResponse
    {
        try {
            $totalPharmacies = Pharmacy::count();
            $totalUsers = User::count();
            $activeSubscriptions = Subscription::where('status', 'active')->count();

            $monthStart = now()->startOfMonth();
            $lastMonthStart = now()->subMonth()->startOfMonth();
            $lastMonthEnd = now()->subMonth()->endOfMonth();

            $monthlyRevenue = Subscription::where('status', 'active')
                ->where('created_at', '>=', $monthStart)
                ->sum('amount');

            $lastMonthRevenue = Subscription::where('status', 'active')
                ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
                ->sum('amount');

            $monthlyGrowth = $lastMonthRevenue > 0
                ? round((($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
                : ($monthlyRevenue > 0 ? 100.0 : 0.0);

            $newRegistrationsThisMonth = User::where('created_at', '>=', $monthStart)->count();

            $pharmaciesByStatus = Pharmacy::select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->get();

            $revenueChart = Subscription::where('status', 'active')
                ->where('created_at', '>=', now()->subDays(30))
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('SUM(amount) as revenue')
                )
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            $COLORS = [
                'trial' => '#0FD452',
                'pending' => '#f59e0b',
                'active' => '#3b82f6',
                'expired' => '#ef4444',
                'suspended' => '#8b5cf6',
            ];
            $subscriptionBreakdown = Pharmacy::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get()
                ->map(fn ($row) => [
                    'name' => ucfirst($row->status),
                    'count' => (int) $row->count,
                    'color' => $COLORS[$row->status] ?? '#6b7280',
                ])
                ->toArray();

            return response()->json([
                'total_pharmacies' => $totalPharmacies,
                'total_users' => $totalUsers,
                'active_subscriptions' => $activeSubscriptions,
                'monthly_revenue' => (float) $monthlyRevenue,
                'monthly_growth' => $monthlyGrowth,
                'new_registrations_this_month' => $newRegistrationsThisMonth,
                'pharmacies_by_status' => $pharmaciesByStatus,
                'revenue_chart' => $revenueChart,
                'subscription_breakdown' => $subscriptionBreakdown,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch admin dashboard.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function staffDashboard(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $pharmacyIds = $user->isOwner()
                ? Pharmacy::where('owner_id', $user->id)->pluck('id')
                : $user->pharmacy()->pluck('pharmacies.id');

            $today = now()->toDateString();

            $todaySales = Order::whereIn('pharmacy_id', $pharmacyIds)
                ->whereDate('created_at', $today)
                ->where('payment_status', 'paid')
                ->sum('total');

            $ordersToday = Order::whereIn('pharmacy_id', $pharmacyIds)
                ->whereDate('created_at', $today)
                ->count();

            $pendingPrescriptions = Prescription::whereIn('pharmacy_id', $pharmacyIds)
                ->where('status', 'pending')
                ->count();

            $lowStockAlerts = Drug::whereIn('pharmacy_id', $pharmacyIds)
                ->whereColumn('quantity', '<=', 'reorder_level')
                ->count();

            $expiringDrugs = Drug::whereIn('pharmacy_id', $pharmacyIds)
                ->whereBetween('expiry_date', [now(), now()->addDays(30)])
                ->count();

            $recentOrders = Order::whereIn('pharmacy_id', $pharmacyIds)
                ->with('customer')
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn ($o) => [
                    'id' => $o->id,
                    'order_code' => $o->order_code,
                    'customer' => $o->customer?->name ?? 'Walk-in',
                    'total' => (float) $o->total,
                    'status' => $o->order_status,
                    'time' => $o->created_at->format('h:i A'),
                ]);

            $lowStockDrugs = Drug::whereIn('pharmacy_id', $pharmacyIds)
                ->whereColumn('quantity', '<=', 'reorder_level')
                ->orderBy('quantity')
                ->limit(8)
                ->get(['name', 'quantity', 'reorder_level']);

            return response()->json([
                'today_sales' => (float) $todaySales,
                'orders_today' => $ordersToday,
                'active_prescriptions' => $pendingPrescriptions,
                'low_stock_alerts' => $lowStockAlerts,
                'expiring_drugs' => $expiringDrugs,
                'recent_orders' => $recentOrders,
                'low_stock_drugs' => $lowStockDrugs,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch staff dashboard.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function pharmacistDashboard(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $pharmacyIds = $user->pharmacy()->pluck('pharmacies.id');

            $pendingPrescriptions = Prescription::whereIn('pharmacy_id', $pharmacyIds)
                ->where('status', 'pending')
                ->with(['customer', 'items.drug'])
                ->latest()
                ->get();

            $todayDispensed = Prescription::whereIn('pharmacy_id', $pharmacyIds)
                ->where('status', 'dispensed')
                ->whereDate('dispensed_at', now()->toDateString())
                ->count();

            $lowStockAlerts = Drug::whereIn('pharmacy_id', $pharmacyIds)
                ->whereColumn('quantity', '<=', 'reorder_level')
                ->with('category')
                ->get();

            $expiringDrugs = Drug::whereIn('pharmacy_id', $pharmacyIds)
                ->whereBetween('expiry_date', [now(), now()->addDays(30)])
                ->with('category')
                ->orderBy('expiry_date')
                ->get();

            return response()->json([
                'pending_prescriptions' => $pendingPrescriptions,
                'today_dispensed' => $todayDispensed,
                'low_stock_alerts' => $lowStockAlerts,
                'expiring_drugs' => $expiringDrugs,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch pharmacist dashboard.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
