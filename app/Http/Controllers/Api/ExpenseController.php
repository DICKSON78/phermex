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

            return response()->json($expenses);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch expenses.',
                'error' => $e->getMessage(),
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
                'error' => $e->getMessage(),
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
                'error' => $e->getMessage(),
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
                'error' => $e->getMessage(),
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
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function monthlySummary(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');
            $year = $request->input('date_from', now()->year);
            $month = $request->input('date_to', now()->month);

            $query = Expense::where('pharmacy_id', $pharmacyId)
                ->whereYear('date', $year)
                ->whereMonth('date', $month);

            $totalExpenses = (clone $query)->sum('amount');
            $categoryBreakdown = (clone $query)
                ->select('category', DB::raw('SUM(amount) as total'))
                ->groupBy('category')
                ->get();

            $dailyExpenses = (clone $query)
                ->select('date', DB::raw('SUM(amount) as total'))
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            return response()->json([
                'year' => (int) $year,
                'month' => (int) $month,
                'total_expenses' => (float) $totalExpenses,
                'category_breakdown' => $categoryBreakdown,
                'daily_expenses' => $dailyExpenses,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate monthly summary.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
