<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Budget;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class BudgetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $query = Budget::with(['account', 'creator'])
                ->where('pharmacy_id', $pharmacyId);

            if ($request->filled('year')) {
                $query->where('budget_year', $request->input('year'));
            }

            if ($request->filled('month')) {
                $query->where('budget_month', $request->input('month'));
            }

            if ($request->filled('account_id')) {
                $query->where('account_id', $request->input('account_id'));
            }

            $budgets = $query->orderByDesc('budget_year')
                ->orderByDesc('budget_month')
                ->paginate($request->input('per_page', 50));

            return response()->json($budgets);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch budgets.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'account_id' => 'required|exists:accounts,id',
                'budget_year' => 'required|integer|min:2020|max:2100',
                'budget_month' => 'required|integer|min:1|max:12',
                'budgeted_amount' => 'required|numeric|min:0',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            if (!in_array((int) $request->pharmacy_id, $request->user()->accessiblePharmacyIds(), true)) {
                return response()->json(['message' => 'You do not have access to this pharmacy.'], 403);
            }

            $validated = $validator->validated();
            $validated['created_by'] = Auth::id();

            $existing = Budget::where('pharmacy_id', $validated['pharmacy_id'])
                ->where('account_id', $validated['account_id'])
                ->where('budget_year', $validated['budget_year'])
                ->where('budget_month', $validated['budget_month'])
                ->first();

            if ($existing) {
                $existing->update([
                    'budgeted_amount' => $validated['budgeted_amount'],
                    'notes' => $validated['notes'] ?? $existing->notes,
                ]);

                return response()->json([
                    'message' => 'Budget updated successfully.',
                    'budget' => $existing->fresh()->load(['account', 'creator']),
                ]);
            }

            $budget = Budget::create($validated);

            return response()->json([
                'message' => 'Budget created successfully.',
                'budget' => $budget->load(['account', 'creator']),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create budget.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $budget = Budget::with(['account', 'creator'])
                ->findOrFail($id);

            $variance = $budget->getVariance();
            $variancePercentage = $budget->getVariancePercentage();

            return response()->json([
                'budget' => $budget,
                'variance' => $variance,
                'variance_percentage' => $variancePercentage,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Budget not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch budget.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function getSummary(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');
            $year = $request->input('year', now()->year);

            $budgets = Budget::with('account')
                ->where('pharmacy_id', $pharmacyId)
                ->where('budget_year', $year)
                ->get();

            $summary = $budgets->groupBy(fn ($b) => $b->account ? $b->account->account_type : 'unknown')
                ->map(function ($items, $type) {
                    return [
                        'type' => $type,
                        'total_budgeted' => $items->sum('budgeted_amount'),
                        'total_actual' => $items->sum('actual_amount'),
                        'total_variance' => $items->sum(function ($b) {
                            return (float) $b->actual_amount - (float) $b->budgeted_amount;
                        }),
                        'count' => $items->count(),
                    ];
                })
                ->values();

            return response()->json([
                'year' => (int) $year,
                'summary' => $summary,
                'total_budgeted' => $budgets->sum('budgeted_amount'),
                'total_actual' => $budgets->sum('actual_amount'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate budget summary.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function getVarianceReport(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');
            $year = $request->input('year', now()->year);

            $budgets = Budget::with('account')
                ->where('pharmacy_id', $pharmacyId)
                ->where('budget_year', $year)
                ->orderBy('budget_month')
                ->get();

            $monthlyData = $budgets->groupBy('budget_month')
                ->map(function ($items, $month) {
                    return [
                        'month' => (int) $month,
                        'month_name' => date('M', mktime(0, 0, 0, $month, 1)),
                        'budgeted' => $items->sum('budgeted_amount'),
                        'actual' => $items->sum('actual_amount'),
                        'variance' => $items->sum(function ($b) {
                            return (float) $b->actual_amount - (float) $b->budgeted_amount;
                        }),
                        'variance_percentage' => 0,
                    ];
                })
                ->values();

            foreach ($monthlyData as &$month) {
                if ($month['budgeted'] > 0) {
                    $month['variance_percentage'] = round(($month['variance'] / $month['budgeted']) * 100, 2);
                }
            }

            $accountBreakdown = $budgets->groupBy('account_id')
                ->map(function ($items) {
                    $account = $items->first()->account;
                    $budgeted = $items->sum('budgeted_amount');
                    $actual = $items->sum('actual_amount');
                    return [
                        'account_id' => $account?->id,
                        'account_code' => $account?->account_code,
                        'account_name' => $account?->account_name,
                        'account_type' => $account?->account_type,
                        'total_budgeted' => $budgeted,
                        'total_actual' => $actual,
                        'variance' => $actual - $budgeted,
                        'variance_percentage' => $budgeted > 0 ? round((($actual - $budgeted) / $budgeted) * 100, 2) : 0,
                    ];
                })
                ->values();

            return response()->json([
                'year' => (int) $year,
                'monthly_data' => $monthlyData,
                'account_breakdown' => $accountBreakdown,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate variance report.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
