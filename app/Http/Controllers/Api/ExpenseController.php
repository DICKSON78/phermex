<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $query = Expense::with('recorder')
                ->when($pharmacyId, fn ($q) => $q->where('pharmacy_id', $pharmacyId));

            if ($request->filled('category')) {
                $query->where('category', $request->input('category'));
            }

            if ($request->filled('date_from')) {
                $query->whereDate('date', '>=', $request->input('date_from'));
            }

            if ($request->filled('date_to')) {
                $query->whereDate('date', '<=', $request->input('date_to'));
            }

            $expenses = $query->latest('date')->paginate($request->input('per_page', 20));

            $summaryQuery = Expense::where('pharmacy_id', $pharmacyId);

            if ($request->filled('category')) {
                $summaryQuery->where('category', $request->input('category'));
            }

            if ($request->filled('date_from')) {
                $summaryQuery->whereDate('date', '>=', $request->input('date_from'));
            }

            if ($request->filled('date_to')) {
                $summaryQuery->whereDate('date', '<=', $request->input('date_to'));
            }

            $summary = [
                'total_amount' => (float) $summaryQuery->sum('amount'),
                'expense_count' => $summaryQuery->count(),
                'category_breakdown' => (clone $summaryQuery)
                    ->select('category', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
                    ->groupBy('category')
                    ->get(),
            ];

            return response()->json([
                'data' => $expenses->items(),
                'summary' => $summary,
                'meta' => [
                    'current_page' => $expenses->currentPage(),
                    'last_page' => $expenses->lastPage(),
                    'per_page' => $expenses->perPage(),
                    'total' => $expenses->total(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch expenses.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'category' => 'required|string|max:255',
                'description' => 'nullable|string',
                'amount' => 'required|numeric|min:0.01',
                'date' => 'required|date',
                'receipt_number' => 'nullable|string|max:255',
            ]);

            $validated['recorded_by'] = Auth::id();

            $expense = Expense::create($validated);

            return response()->json([
                'message' => 'Expense recorded successfully.',
                'expense' => $expense->load('recorder'),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to record expense.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $expense = Expense::with('recorder')->findOrFail($id);

            return response()->json([
                'expense' => $expense,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Expense not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch expense.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $expense = Expense::findOrFail($id);

            $validated = $request->validate([
                'category' => 'sometimes|string|max:255',
                'description' => 'sometimes|nullable|string',
                'amount' => 'sometimes|numeric|min:0.01',
                'date' => 'sometimes|date',
                'receipt_number' => 'sometimes|nullable|string|max:255',
            ]);

            $expense->update($validated);

            return response()->json([
                'message' => 'Expense updated successfully.',
                'expense' => $expense->fresh()->load('recorder'),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Expense not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update expense.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $expense = Expense::findOrFail($id);
            $expense->delete();

            return response()->json([
                'message' => 'Expense deleted successfully.',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Expense not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete expense.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function monthlySummary(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');
            $months = (int) $request->input('months', 6);

            $monthlyData = Expense::where('pharmacy_id', $pharmacyId)
                ->whereDate('date', '>=', now()->subMonths($months)->startOfMonth())
                ->select(
                    DB::raw('YEAR(date) as year'),
                    DB::raw('MONTH(date) as month'),
                    DB::raw('SUM(amount) as total'),
                    DB::raw('COUNT(*) as expense_count')
                )
                ->groupBy('year', 'month')
                ->orderBy('year')
                ->orderBy('month')
                ->get();

            $categoryBreakdown = Expense::where('pharmacy_id', $pharmacyId)
                ->whereDate('date', '>=', now()->subMonths($months)->startOfMonth())
                ->select('category', DB::raw('SUM(amount) as total'))
                ->groupBy('category')
                ->orderByDesc('total')
                ->get();

            $currentMonthTotal = (float) Expense::where('pharmacy_id', $pharmacyId)
                ->whereYear('date', now()->year)
                ->whereMonth('date', now()->month)
                ->sum('amount');

            $previousMonthTotal = (float) Expense::where('pharmacy_id', $pharmacyId)
                ->whereYear('date', now()->subMonth()->year)
                ->whereMonth('date', now()->subMonth()->month)
                ->sum('amount');

            return response()->json([
                'monthly_data' => $monthlyData,
                'category_breakdown' => $categoryBreakdown,
                'current_month' => [
                    'year' => (int) now()->year,
                    'month' => (int) now()->month,
                    'total' => $currentMonthTotal,
                ],
                'previous_month' => [
                    'year' => (int) now()->subMonth()->year,
                    'month' => (int) now()->subMonth()->month,
                    'total' => $previousMonthTotal,
                ],
                'month_over_month_change' => $previousMonthTotal > 0
                    ? round((($currentMonthTotal - $previousMonthTotal) / $previousMonthTotal) * 100, 2)
                    : null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate monthly summary.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function categories(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $existing = Expense::where('pharmacy_id', $pharmacyId)
                ->whereNotNull('category')
                ->distinct()
                ->pluck('category')
                ->map(fn ($c) => (string) $c)
                ->unique()
                ->values()
                ->toArray();

            $defaults = ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Marketing', 'Other'];

            $categories = array_values(array_unique(array_merge($defaults, $existing)));

            return response()->json(['categories' => $categories]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to load categories.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
