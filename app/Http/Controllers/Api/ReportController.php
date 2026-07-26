<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Drug;
use App\Models\DrugCategory;
use App\Models\Expense;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function salesReport(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'date_from' => 'required|date',
                'date_to' => 'required|date|after_or_equal:date_from',
                'pharmacy_id' => 'required|exists:pharmacies,id',
            ]);

            $pharmacyId = $request->input('pharmacy_id');
            $dateFrom = $request->input('date_from');
            $dateTo = $request->input('date_to');

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

            return response()->json([
                'total_revenue' => (float) $totalRevenue,
                'total_orders' => $totalOrders,
                'average_order_value' => round($averageOrderValue, 2),
                'daily_sales' => $dailySales,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate sales report.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function inventoryReport(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
            ]);

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
            $expiringSoon = $drugs->filter(fn ($drug) =>
                $drug->expiry_date && now()->diffInDays($drug->expiry_date, false) <= 30
            )->count();

            return response()->json([
                'total_items' => $drugs->count(),
                'total_stock_value' => round((float) $totalStockValue, 2),
                'total_retail_value' => round((float) $totalRetailValue, 2),
                'by_category' => $byCategory,
                'low_stock_count' => $lowStock,
                'expiring_soon_count' => $expiringSoon,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate inventory report.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function financialReport(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'date_from' => 'required|date',
                'date_to' => 'required|date|after_or_equal:date_from',
            ]);

            $pharmacyId = $request->input('pharmacy_id');
            $dateFrom = $request->input('date_from');
            $dateTo = $request->input('date_to');

            $revenue = Order::where('pharmacy_id', $pharmacyId)
                ->whereDate('created_at', '>=', $dateFrom)
                ->whereDate('created_at', '<=', $dateTo)
                ->where('payment_status', 'paid')
                ->sum('total');

            $expenses = Expense::where('pharmacy_id', $pharmacyId)
                ->whereDate('created_at', '>=', $dateFrom)
                ->whereDate('created_at', '<=', $dateTo)
                ->sum('amount');

            $netProfit = $revenue - $expenses;

            $expenseBreakdown = Expense::where('pharmacy_id', $pharmacyId)
                ->whereDate('created_at', '>=', $dateFrom)
                ->whereDate('created_at', '<=', $dateTo)
                ->select('category', DB::raw('SUM(amount) as total'))
                ->groupBy('category')
                ->get();

            return response()->json([
                'revenue' => (float) $revenue,
                'expenses' => (float) $expenses,
                'net_profit' => (float) $netProfit,
                'profit_margin' => $revenue > 0 ? round(($netProfit / $revenue) * 100, 2) : 0,
                'expense_breakdown' => $expenseBreakdown,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate financial report.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function customerReport(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
            ]);

            $pharmacyId = $request->input('pharmacy_id');

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
                    DB::raw('MAX(orders.created_at) as last_order_date')
                )
                ->groupBy('customers.id', 'customers.full_name', 'customers.phone', 'customers.email')
                ->orderByDesc('total_spent')
                ->limit(20)
                ->get();

            $totalCustomers = DB::table('customers')
                ->where('pharmacy_id', $pharmacyId)
                ->count();

            $newCustomersThisMonth = DB::table('customers')
                ->where('pharmacy_id', $pharmacyId)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();

            return response()->json([
                'total_customers' => $totalCustomers,
                'new_customers_this_month' => $newCustomersThisMonth,
                'top_customers' => $topCustomers,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate customer report.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
