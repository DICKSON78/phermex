<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Drug;
use App\Models\DrugCategory;
use App\Models\DrugMovement;
use App\Models\Expense;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Pharmacy;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Resolve the report date window from the SPA `range` filter.
     */
    private function resolveRange(Request $request): array
    {
        $range = $request->input('range');
        $from = $request->input('from');
        $to = $request->input('to');

        $parse = fn (?string $value, $fallback) => $value ? Carbon::parse($value) : $fallback;

        return match ($range) {
            'week' => [now()->startOfWeek(), now()],
            'quarter' => [now()->startOfQuarter(), now()],
            'year' => [now()->startOfYear(), now()],
            'custom' => [$parse($from, now()->subDays(30)), $parse($to, now())],
            default => [$parse($from, now()->startOfMonth()), $parse($to, now())],
        };
    }

    private function paidOrderScope(int $pharmacyId, Carbon $dateFrom, Carbon $dateTo): callable
    {
        return function ($q) use ($pharmacyId, $dateFrom, $dateTo) {
            $q->where('pharmacy_id', $pharmacyId)
                ->where('payment_status', 'paid')
                ->whereDate('created_at', '>=', $dateFrom)
                ->whereDate('created_at', '<=', $dateTo);
        };
    }

    public function salesReport(Request $request): JsonResponse
    {
        try {
            $request->validate(['pharmacy_id' => 'required|exists:pharmacies,id']);
            $pharmacyId = $request->input('pharmacy_id');

            [$dateFrom, $dateTo] = $this->resolveRange($request);
            $dateFrom = $dateFrom->copy()->startOfDay();
            $dateTo = $dateTo->copy()->endOfDay();

            $orderScope = $this->paidOrderScope($pharmacyId, $dateFrom, $dateTo);
            $orders = Order::where($orderScope);

            $totalRevenue = (float) (clone $orders)->sum('total');
            $totalOrders = (clone $orders)->count();
            $averageOrderValue = $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0;
            $itemsSold = (int) OrderItem::whereHas('order', $orderScope)->sum('quantity');

            // Revenue trend = % change vs the previous, equal-length window.
            $periodDays = (int) $dateFrom->diffInDays($dateTo) + 1;
            $prevTo = $dateFrom->copy()->subDay();
            $prevFrom = $prevTo->copy()->subDays($periodDays - 1);
            $prevRevenue = (float) Order::where('pharmacy_id', $pharmacyId)
                ->where('payment_status', 'paid')
                ->whereDate('created_at', '>=', $prevFrom)
                ->whereDate('created_at', '<=', $prevTo)
                ->sum('total');
            $revenueTrend = $prevRevenue > 0 ? round((($totalRevenue - $prevRevenue) / $prevRevenue) * 100, 2) : 0;

            $revenueChart = Order::where($orderScope)
                ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as revenue'))
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(fn ($row) => [
                    'date' => $row->date,
                    'revenue' => round((float) $row->revenue, 2),
                ])
                ->values();

            $topSellingDrugs = OrderItem::whereHas('order', $orderScope)
                ->select('drug_id', DB::raw('SUM(quantity) as quantity_sold'), DB::raw('SUM(total_price) as revenue'))
                ->with('drug:id,name')
                ->groupBy('drug_id')
                ->orderByDesc('revenue')
                ->limit(10)
                ->get()
                ->map(fn ($item) => [
                    'name' => $item->drug?->name ?? 'Unknown',
                    'quantitySold' => (int) $item->quantity_sold,
                    'revenue' => round((float) $item->revenue, 2),
                ])
                ->values();

            $paymentMethods = Order::where($orderScope)
                ->select('payment_method as method', DB::raw('COUNT(*) as count'), DB::raw('SUM(total) as amount'))
                ->groupBy('payment_method')
                ->get()
                ->map(fn ($row) => [
                    'method' => ucfirst($row->method),
                    'count' => (int) $row->count,
                    'amount' => round((float) $row->amount, 2),
                ])
                ->values();

            return response()->json([
                'totalRevenue' => $totalRevenue,
                'totalOrders' => $totalOrders,
                'avgOrderValue' => $averageOrderValue,
                'itemsSold' => $itemsSold,
                'revenueTrend' => $revenueTrend,
                'revenueChart' => $revenueChart,
                'topSellingDrugs' => $topSellingDrugs,
                'paymentMethods' => $paymentMethods,
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

            $totalStockValue = round($drugs->sum(function ($drug) {
                return $drug->quantity * $drug->buying_price;
            }), 2);

            $lowStockItems = $drugs
                ->filter(fn ($drug) => $drug->quantity <= $drug->reorder_level)
                ->values()
                ->map(fn ($drug) => [
                    'name' => $drug->name,
                    'currentStock' => (int) $drug->quantity,
                    'reorderLevel' => (int) $drug->reorder_level,
                ]);

            $expiringSoon = $drugs
                ->filter(fn ($drug) =>
                    $drug->expiry_date && now()->diffInDays($drug->expiry_date, false) <= 30 && $drug->expiry_date->isFuture()
                )
                ->values()
                ->map(fn ($drug) => [
                    'name' => $drug->name,
                    'quantity' => (int) $drug->quantity,
                    'expiryDate' => $drug->expiry_date->toDateString(),
                ]);

            $categoryDistribution = $drugs->groupBy('category_id')->map(function ($items, $categoryId) {
                $category = DrugCategory::find($categoryId);
                return [
                    'category' => $category ? $category->name : 'Unknown',
                    'count' => $items->count(),
                ];
            })->values();

            $movementCounts = DrugMovement::where('pharmacy_id', $pharmacyId)
                ->select('movement_type', DB::raw('SUM(quantity) as total_quantity'))
                ->groupBy('movement_type')
                ->pluck('total_quantity', 'movement_type');

            $movementKeys = ['purchase' => 'received', 'sale' => 'dispensed', 'return' => 'returned', 'expiry' => 'expired'];
            $stockMovements = [];
            foreach ($movementKeys as $type => $key) {
                $stockMovements[$key] = (int) ($movementCounts[$type] ?? 0);
            }

            return response()->json([
                'totalDrugs' => $drugs->count(),
                'totalStockValue' => $totalStockValue,
                'lowStockItems' => $lowStockItems,
                'expiringSoon' => $expiringSoon,
                'categoryDistribution' => $categoryDistribution,
                'stockMovements' => $stockMovements,
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

            [$dateFrom, $dateTo] = $this->resolveRange($request);
            $dateFrom = $dateFrom->copy()->startOfDay();
            $dateTo = $dateTo->copy()->endOfDay();

            $orderScope = $this->paidOrderScope($pharmacyId, $dateFrom, $dateTo);

            $revenue = (float) Order::where($orderScope)->sum('total');

            $expenses = (float) Expense::where('pharmacy_id', $pharmacyId)
                ->whereDate('date', '>=', $dateFrom)
                ->whereDate('date', '<=', $dateTo)
                ->sum('amount');

            $netProfit = round($revenue - $expenses, 2);
            $profitMargin = $revenue > 0 ? round(($netProfit / $revenue) * 100, 2) : 0;

            $revenueByDay = Order::where($orderScope)
                ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as revenue'))
                ->groupBy('date')
                ->get();

            $expenseByDay = Expense::where('pharmacy_id', $pharmacyId)
                ->whereDate('date', '>=', $dateFrom)
                ->whereDate('date', '<=', $dateTo)
                ->select('date', DB::raw('SUM(amount) as expenses'))
                ->groupBy('date')
                ->get();

            $revenueByMonth = $revenueByDay->groupBy(fn ($row) => Carbon::parse($row->date)->format('M Y'));
            $expenseByMonth = $expenseByDay->groupBy(fn ($row) => Carbon::parse($row->date)->format('M Y'));

            $months = $revenueByMonth->keys()->merge($expenseByMonth->keys())->unique()
                ->sortBy(fn ($m) => Carbon::parse('01 ' . $m)->timestamp)
                ->values();

            $monthlyPL = $months->map(function ($month) use ($revenueByMonth, $expenseByMonth) {
                $monthRevenue = round((float) $revenueByMonth->get($month)?->sum('revenue') ?? 0, 2);
                $monthExpenses = round((float) $expenseByMonth->get($month)?->sum('expenses') ?? 0, 2);
                return [
                    'month' => $month,
                    'revenue' => $monthRevenue,
                    'expenses' => $monthExpenses,
                    'profit' => round($monthRevenue - $monthExpenses, 2),
                ];
            })->values();

            $expenseBreakdown = Expense::where('pharmacy_id', $pharmacyId)
                ->whereDate('date', '>=', $dateFrom)
                ->whereDate('date', '<=', $dateTo)
                ->select('category', DB::raw('SUM(amount) as amount'))
                ->groupBy('category')
                ->orderByDesc('amount')
                ->get()
                ->map(fn ($row) => [
                    'category' => $row->category,
                    'amount' => round((float) $row->amount, 2),
                ])
                ->values();

            return response()->json([
                'revenue' => $revenue,
                'expenses' => $expenses,
                'profit' => $netProfit,
                'profitMargin' => $profitMargin,
                'monthlyPL' => $monthlyPL,
                'expenseBreakdown' => $expenseBreakdown,
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

            $totalCustomers = Customer::where('pharmacy_id', $pharmacyId)->count();

            $newCustomersThisMonth = Customer::where('pharmacy_id', $pharmacyId)
                ->whereDate('created_at', '>=', now()->startOfMonth())
                ->count();

            $paidOrderCounts = DB::table('orders')
                ->where('pharmacy_id', $pharmacyId)
                ->where('payment_status', 'paid')
                ->whereNotNull('customer_id')
                ->select('customer_id', DB::raw('COUNT(*) as order_count'))
                ->groupBy('customer_id')
                ->get();

            $repeatCustomers = $paidOrderCounts->filter(fn ($row) => $row->order_count > 1)->count();
            $retentionRate = $totalCustomers > 0 ? round(($repeatCustomers / $totalCustomers) * 100, 2) : 0;

            $totalPaidOrders = $paidOrderCounts->sum('order_count');
            $avgOrdersPerCustomer = $totalCustomers > 0 ? round($totalPaidOrders / $totalCustomers, 1) : 0;

            $topCustomers = DB::table('orders')
                ->join('customers', 'orders.customer_id', '=', 'customers.id')
                ->where('orders.pharmacy_id', $pharmacyId)
                ->where('orders.payment_status', 'paid')
                ->select(
                    'customers.full_name',
                    DB::raw('COUNT(orders.id) as total_orders'),
                    DB::raw('SUM(orders.total) as total_spent')
                )
                ->groupBy('customers.full_name')
                ->orderByDesc('total_spent')
                ->limit(20)
                ->get()
                ->map(fn ($row) => [
                    'name' => $row->full_name,
                    'orders' => (int) $row->total_orders,
                    'totalSpent' => round((float) $row->total_spent, 2),
                ])
                ->values();

            return response()->json([
                'totalCustomers' => $totalCustomers,
                'newCustomersThisMonth' => $newCustomersThisMonth,
                'retentionRate' => $retentionRate,
                'avgOrdersPerCustomer' => $avgOrdersPerCustomer,
                'topCustomers' => $topCustomers,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate customer report.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
