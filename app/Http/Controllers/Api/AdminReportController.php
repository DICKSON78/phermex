<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Pharmacy;
use App\Models\RevenueRecord;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $totalPharmacies = Pharmacy::count();
            $activePharmacies = Pharmacy::where('status', 'active')->count();
            $suspendedPharmacies = Pharmacy::where('status', 'suspended')->count();
            $trialPharmacies = Pharmacy::where('application_status', 'approved')
                ->where('payment_status', '!=', 'paid')
                ->count();

            $totalUsers = User::count();
            $usersByRole = User::select('role', DB::raw('count(*) as count'))
                ->groupBy('role')
                ->pluck('count', 'role')
                ->toArray();

            $totalRevenue = (float) RevenueRecord::where('status', 'paid')->sum('amount');
            $pendingRevenue = (float) RevenueRecord::where('status', 'pending')->sum('amount');
            $overdueRevenue = (float) RevenueRecord::where('status', 'overdue')->sum('amount');

            $totalOrders = Order::count();
            $paidOrders = Order::where('payment_status', 'paid')->count();
            $totalOrderValue = (float) Order::where('payment_status', 'paid')->sum('total');

            $currentMonth = now()->month;
            $currentYear = now()->year;
            $lastMonth = now()->subMonth();

            $pharmaciesThisMonth = Pharmacy::whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->count();
            $pharmaciesLastMonth = Pharmacy::whereMonth('created_at', $lastMonth->month)
                ->whereYear('created_at', $lastMonth->year)
                ->count();

            $usersThisMonth = User::whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->count();
            $usersLastMonth = User::whereMonth('created_at', $lastMonth->month)
                ->whereYear('created_at', $lastMonth->year)
                ->count();

            $revenueThisMonth = (float) RevenueRecord::where('status', 'paid')
                ->whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->sum('amount');
            $revenueLastMonth = (float) RevenueRecord::where('status', 'paid')
                ->whereMonth('created_at', $lastMonth->month)
                ->whereYear('created_at', $lastMonth->year)
                ->sum('amount');

            $ordersThisMonth = Order::whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->count();
            $ordersLastMonth = Order::whereMonth('created_at', $lastMonth->month)
                ->whereYear('created_at', $lastMonth->year)
                ->count();

            $calculateGrowth = function ($current, $previous) {
                if ($previous == 0) {
                    return $current > 0 ? 100.0 : 0.0;
                }
                return round((($current - $previous) / $previous) * 100, 1);
            };

            $revenueByType = RevenueRecord::where('status', 'paid')
                ->select('type', DB::raw('SUM(amount) as total'))
                ->groupBy('type')
                ->pluck('total', 'type')
                ->toArray();

            $monthlyRevenue = RevenueRecord::where('status', 'paid')
                ->where('created_at', '>=', now()->subMonths(12))
                ->select(
                    DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                    DB::raw('SUM(amount) as revenue')
                )
                ->groupBy('month')
                ->orderBy('month')
                ->get();

            $ordersByStatus = Order::select('order_status', DB::raw('count(*) as count'))
                ->groupBy('order_status')
                ->get()
                ->map(function ($item) {
                    $colors = [
                        'pending' => '#F59E0B',
                        'processing' => '#3B82F6',
                        'completed' => '#10B981',
                        'cancelled' => '#EF4444',
                        'delivered' => '#0FD452',
                    ];
                    return [
                        'status' => ucfirst($item->order_status),
                        'count' => (int) $item->count,
                        'fill' => $colors[$item->order_status] ?? '#6B7280',
                    ];
                });

            return response()->json([
                'data' => [
                    'stats' => [
                        'totalRevenue' => $totalRevenue,
                        'totalOrders' => $totalOrders,
                        'activeUsers' => $totalUsers,
                        'growthRate' => $calculateGrowth($revenueThisMonth, $revenueLastMonth),
                    ],
                    'pharmacies' => [
                        'total' => $totalPharmacies,
                        'active' => $activePharmacies,
                        'suspended' => $suspendedPharmacies,
                        'trial' => $trialPharmacies,
                        'this_month' => $pharmaciesThisMonth,
                    ],
                    'users' => [
                        'total' => $totalUsers,
                        'by_role' => $usersByRole,
                        'this_month' => $usersThisMonth,
                    ],
                    'revenue' => [
                        'total' => $totalRevenue,
                        'pending' => $pendingRevenue,
                        'overdue' => $overdueRevenue,
                        'this_month' => $revenueThisMonth,
                        'by_type' => $revenueByType,
                    ],
                    'orders' => [
                        'total' => $totalOrders,
                        'paid' => $paidOrders,
                        'total_value' => $totalOrderValue,
                        'this_month' => $ordersThisMonth,
                    ],
                    'orders_by_status' => $ordersByStatus,
                    'growth' => [
                        'pharmacies' => $calculateGrowth($pharmaciesThisMonth, $pharmaciesLastMonth),
                        'users' => $calculateGrowth($usersThisMonth, $usersLastMonth),
                        'revenue' => $calculateGrowth($revenueThisMonth, $revenueLastMonth),
                        'orders' => $calculateGrowth($ordersThisMonth, $ordersLastMonth),
                    ],
                    'monthly_revenue' => $monthlyRevenue,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate report.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
