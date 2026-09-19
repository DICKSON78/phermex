<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Drug;
use App\Models\DrugCategory;
use App\Models\Expense;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Pharmacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function salesReport(Request $request): JsonResponse
    {
        try {
            $request->validate(['pharmacy_id' => 'required|exists:pharmacies,id']);
            $pharmacyId = $request->input('pharmacy_id');
            $dateFrom = $request->input('date_from', now()->subDays(30)->startOfDay());
            $dateTo = $request->input('date_to', now()->endOfDay());

            $orders = Order::where('pharmacy_id', $pharmacyId)
                ->whereDate('created_at', '>=', $dateFrom)
                ->whereDate('created_at', '<=', $dateTo)
                ->where('payment_status', 'paid');

            $totalRevenue = (clone $orders)->sum('total');
            $totalOrders = (clone $orders)->count();
            $averageOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

            $dailySales = Order::where('pharmacy_id', $pharmacyId)
                ->whereDate('created_at', '>=', $dateFrom)
                ->whereDate('created_at', '<=', $dateTo)
                ->where('payment_status', 'paid')
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(*) as orders'),
                    DB::raw('SUM(total) as revenue')
                )
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            $topDrugs = OrderItem::whereHas('order', function ($q) use ($pharmacyId, $dateFrom, $dateTo) {
                $q->where('pharmacy_id', $pharmacyId)
                    ->whereDate('created_at', '>=', $dateFrom)
                    ->whereDate('created_at', '<=', $dateTo)
                    ->where('payment_status', 'paid');
            })
                ->select('drug_id', DB::raw('SUM(quantity) as total_quantity'), DB::raw('SUM(total_price) as total_revenue'))
                ->groupBy('drug_id')
                ->with('drug:id,name')
                ->orderByDesc('total_revenue')
                ->limit(10)
                ->get();

            return response()->json([
                'total_revenue' => (float) $totalRevenue,
                'total_orders' => $totalOrders,
                'average_order_value' => round($averageOrderValue, 2),
                'daily_sales' => $dailySales,
                'top_drugs' => $topDrugs,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate sales report.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function inventoryReport(Request $request): JsonResponse
    {
        try {
            $request->validate(['pharmacy_id' => 'required|exists:pharmacies,id']);
            $pharmacyId = $request->input('pharmacy_id');

            $drugs = Drug::where('pharmacy_id', $pharmacyId)->get();

            $totalStockValue = $drugs->sum(function ($drug) {
                return $drug->quantity * $drug->buying_price;
            });

            $totalRetailValue = $drugs->sum(function ($drug) {
                return $drug->quantity * $drug->selling_price;
            });

            $byCategory = $drugs->groupBy('category_id')->map(function ($items, $categoryId) {
                $category = DrugCategory::find($categoryId);
                return [
                    'category' => $category ? $category->name : 'Unknown',
                    'count' => $items->count(),
                    'stock_value' => $items->sum(function ($drug) {
                        return $drug->quantity * $drug->buying_price;
                    }),
                ];
            })->values();

            $lowStock = $drugs->filter(fn ($drug) => $drug->quantity <= $drug->reorder_level)->count();
            $outOfStock = $drugs->filter(fn ($drug) => $drug->quantity === 0)->count();
            $expiringSoon = $drugs->filter(fn ($drug) =>
                $drug->expiry_date && now()->diffInDays($drug->expiry_date, false) <= 30 && $drug->expiry_date->isFuture()
            )->count();
            $expired = $drugs->filter(fn ($drug) =>
                $drug->expiry_date && $drug->expiry_date->isPast()
            )->count();

            return response()->json([
                'total_items' => $drugs->count(),
                'total_stock_value' => round((float) $totalStockValue, 2),
                'total_retail_value' => round((float) $totalRetailValue, 2),
                'by_category' => $byCategory,
                'low_stock_count' => $lowStock,
                'out_of_stock_count' => $outOfStock,
                'expiring_soon_count' => $expiringSoon,
                'expired_count' => $expired,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate inventory report.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function financialReport(Request $request): JsonResponse
    {
        try {
            $request->validate(['pharmacy_id' => 'required|exists:pharmacies,id']);
            $pharmacyId = $request->input('pharmacy_id');
            $dateFrom = $request->input('date_from', now()->subDays(30)->startOfDay());
            $dateTo = $request->input('date_to', now()->endOfDay());

            $revenue = Order::where('pharmacy_id', $pharmacyId)
                ->whereDate('created_at', '>=', $dateFrom)
                ->whereDate('created_at', '<=', $dateTo)
                ->where('payment_status', 'paid')
                ->sum('total');

            $expenses = Expense::where('pharmacy_id', $pharmacyId)
                ->whereDate('date', '>=', $dateFrom)
                ->whereDate('date', '<=', $dateTo)
                ->sum('amount');

            $netProfit = $revenue - $expenses;

            $expenseBreakdown = Expense::where('pharmacy_id', $pharmacyId)
                ->whereDate('date', '>=', $dateFrom)
                ->whereDate('date', '<=', $dateTo)
                ->select('category', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
                ->groupBy('category')
                ->orderByDesc('total')
                ->get();

            $dailyProfit = Order::where('pharmacy_id', $pharmacyId)
                ->whereDate('created_at', '>=', $dateFrom)
                ->whereDate('created_at', '<=', $dateTo)
                ->where('payment_status', 'paid')
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('SUM(total) as revenue')
                )
                ->groupBy('date')
                ->get()
                ->map(function ($day) use ($pharmacyId, $dateFrom, $dateTo) {
                    $dayExpenses = Expense::where('pharmacy_id', $pharmacyId)
                        ->whereDate('date', $day->date)
                        ->sum('amount');
                    $day->expenses = (float) $dayExpenses;
                    $day->profit = (float) $day->revenue - $dayExpenses;
                    return $day;
                });

            return response()->json([
                'revenue' => (float) $revenue,
                'expenses' => (float) $expenses,
                'net_profit' => (float) $netProfit,
                'profit_margin' => $revenue > 0 ? round(($netProfit / $revenue) * 100, 2) : 0,
                'expense_breakdown' => $expenseBreakdown,
                'daily_profit' => $dailyProfit,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate financial report.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    /**
     * Consolidated multi-pharmacy financial report. Spans every pharmacy the
     * user can access, so it intentionally does not filter by a single
     * pharmacy_id (TenantScoped still limits results to accessible ones).
     */
    public function consolidatedFinancialReport(Request $request): JsonResponse
    {
        try {
            $dateFrom = $request->input('date_from', now()->subDays(30)->startOfDay());
            $dateTo = $request->input('date_to', now()->endOfDay());

            $paidOrderScope = function ($q) use ($dateFrom, $dateTo) {
                $q->whereDate('created_at', '>=', $dateFrom)
                  ->whereDate('created_at', '<=', $dateTo)
                  ->where('payment_status', 'paid');
            };

            $revenueRows = Order::query()
                ->where($paidOrderScope)
                ->select('pharmacy_id', DB::raw('SUM(total) as revenue'), DB::raw('COUNT(*) as orders_count'), DB::raw('COUNT(DISTINCT user_id) as customers_count'))
                ->groupBy('pharmacy_id')
                ->get();

            $expenseScope = function ($q) use ($dateFrom, $dateTo) {
                $q->whereDate('date', '>=', $dateFrom)
                  ->whereDate('date', '<=', $dateTo);
            };

            $expenseRows = Expense::where($expenseScope)
                ->select('pharmacy_id', DB::raw('SUM(amount) as expenses'), DB::raw('COUNT(*) as expense_count'))
                ->groupBy('pharmacy_id')
                ->get();

            $expenseByPharmacy = $expenseRows->keyBy('pharmacy_id');
            $revenueByPharmacy = $revenueRows->keyBy('pharmacy_id');

            $pharmacyIds = $revenueByPharmacy->keys()->merge($expenseByPharmacy->keys())->unique()->values();
            $pharmacies = Pharmacy::whereIn('id', $pharmacyIds)->get(['id', 'pharmacy_name'])->keyBy('id');

            $pharmacyReports = $pharmacyIds->map(function ($pharmacyId) use ($pharmacies, $revenueByPharmacy, $expenseByPharmacy) {
                $revenue = (float) ($revenueByPharmacy->get($pharmacyId)?->revenue ?? 0);
                $expenses = (float) ($expenseByPharmacy->get($pharmacyId)?->expenses ?? 0);
                $net = $revenue - $expenses;

                return [
                    'pharmacy_id' => (int) $pharmacyId,
                    'pharmacy_name' => $pharmacies->get($pharmacyId)?->pharmacy_name ?? 'Unknown Pharmacy',
                    'revenue' => $revenue,
                    'expenses' => $expenses,
                    'orders_count' => (int) ($revenueByPharmacy->get($pharmacyId)?->orders_count ?? 0),
                    'customers_count' => (int) ($revenueByPharmacy->get($pharmacyId)?->customers_count ?? 0),
                    'expense_count' => (int) ($expenseByPharmacy->get($pharmacyId)?->expense_count ?? 0),
                    'net_profit' => $net,
                    'profit_margin' => $revenue > 0 ? round(($net / $revenue) * 100, 2) : 0,
                ];
            })->values();

            $totals = [
                'revenue' => round($pharmacyReports->sum('revenue'), 2),
                'expenses' => round($pharmacyReports->sum('expenses'), 2),
                'net_profit' => round($pharmacyReports->sum('net_profit'), 2),
                'orders_count' => $pharmacyReports->sum('orders_count'),
                'customers_count' => $pharmacyReports->sum('customers_count'),
                'pharmacies_count' => $pharmacyReports->count(),
            ];

            $totals['profit_margin'] = $totals['revenue'] > 0 ? round(($totals['net_profit'] / $totals['revenue']) * 100, 2) : 0;

            return response()->json([
                'totals' => $totals,
                'pharmacies' => $pharmacyReports,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate consolidated financial report.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function customerReport(Request $request): JsonResponse
    {
        try {
            $request->validate(['pharmacy_id' => 'required|exists:pharmacies,id']);
            $pharmacyId = $request->input('pharmacy_id');
            $dateFrom = $request->input('date_from');
            $dateTo = $request->input('date_to');

            $totalCustomers = Customer::where('pharmacy_id', $pharmacyId)->count();

            $customerQuery = Customer::where('pharmacy_id', $pharmacyId);
            if ($dateFrom) {
                $customerQuery->whereDate('created_at', '>=', $dateFrom);
            }
            if ($dateTo) {
                $customerQuery->whereDate('created_at', '<=', $dateTo);
            }
            $newCustomers = $customerQuery->count();

            $topCustomers = DB::table('orders')
                ->join('customers', 'orders.customer_id', '=', 'customers.id')
                ->where('orders.pharmacy_id', $pharmacyId)
                ->where('orders.payment_status', 'paid')
                ->select(
                    'customers.id',
                    'customers.full_name',
                    'customers.phone',
                    'customers.email',
                    DB::raw('COUNT(orders.id) as total_orders'),
                    DB::raw('SUM(orders.total) as total_spent'),
                    DB::raw('AVG(orders.total) as average_order_value'),
                    DB::raw('MAX(orders.created_at) as last_order_date')
                )
                ->groupBy('customers.id', 'customers.full_name', 'customers.phone', 'customers.email')
                ->orderByDesc('total_spent')
                ->limit(20)
                ->get();

            $orderFrequency = DB::table('orders')
                ->join('customers', 'orders.customer_id', '=', 'customers.id')
                ->where('orders.pharmacy_id', $pharmacyId)
                ->where('orders.payment_status', 'paid')
                ->select(
                    'customers.id',
                    'customers.full_name',
                    DB::raw('COUNT(orders.id) as order_count'),
                    DB::raw('MIN(orders.created_at) as first_order'),
                    DB::raw('MAX(orders.created_at) as last_order')
                )
                ->groupBy('customers.id', 'customers.full_name')
                ->having('order_count', '>', 1)
                ->orderByDesc('order_count')
                ->limit(20)
                ->get();

            return response()->json([
                'total_customers' => $totalCustomers,
                'new_customers' => $newCustomers,
                'top_customers' => $topCustomers,
                'order_frequency' => $orderFrequency,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate customer report.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
