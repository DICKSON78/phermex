<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $query = Account::with(['parent', 'children'])
                ->where('pharmacy_id', $pharmacyId);

            if ($request->filled('type')) {
                $query->where('account_type', $request->input('type'));
            }

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('account_name', 'like', "%{$search}%")
                      ->orWhere('account_code', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            if ($request->filled('parent_id')) {
                $query->where('parent_id', $request->input('parent_id'));
            }

            if ($request->boolean('active_only', true)) {
                $query->active();
            }

            $accounts = $query->orderBy('account_code')->paginate($request->input('per_page', 50));

            return response()->json($accounts);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch accounts.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'account_code' => 'required|string|max:20',
                'account_name' => 'required|string|max:255',
                'account_type' => 'required|in:asset,liability,equity,revenue,expense',
                'parent_id' => 'nullable|exists:accounts,id',
                'description' => 'nullable|string',
                'currency' => 'nullable|string|max:10',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $exists = Account::where('pharmacy_id', $request->pharmacy_id)
                ->where('account_code', $request->account_code)
                ->exists();

            if ($exists) {
                return response()->json([
                    'message' => 'Account code already exists for this pharmacy.',
                ], 422);
            }

            $account = Account::create($validator->validated());

            return response()->json([
                'message' => 'Account created successfully.',
                'account' => $account,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create account.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function show(Request $request, $id): JsonResponse
    {
        try {
            $account = Account::with(['parent', 'children', 'journalLines.journalEntry'])
                ->findOrFail($id);

            $transactions = $account->getTransactions();

            return response()->json([
                'account' => $account,
                'transactions' => $transactions,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Account not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch account.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $account = Account::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'account_name' => 'sometimes|string|max:255',
                'account_type' => 'sometimes|in:asset,liability,equity,revenue,expense',
                'parent_id' => 'nullable|exists:accounts,id',
                'description' => 'sometimes|nullable|string',
                'is_active' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $account->update($validator->validated());

            return response()->json([
                'message' => 'Account updated successfully.',
                'account' => $account->fresh(),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Account not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update account.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $account = Account::findOrFail($id);

            if ($account->journalLines()->count() > 0) {
                return response()->json([
                    'message' => 'Cannot delete account with existing journal entries.',
                ], 422);
            }

            if ($account->children()->count() > 0) {
                return response()->json([
                    'message' => 'Cannot delete account with child accounts.',
                ], 422);
            }

            $account->delete();

            return response()->json([
                'message' => 'Account deleted successfully.',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Account not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete account.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function getTree(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $accounts = Account::where('pharmacy_id', $pharmacyId)
                ->active()
                ->orderBy('account_code')
                ->get();

            $tree = $this->buildTree($accounts, null);

            return response()->json(['tree' => $tree]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to build account tree.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function getBalances(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $balances = Account::where('pharmacy_id', $pharmacyId)
                ->active()
                ->select('account_type', DB::raw('SUM(balance) as total_balance'))
                ->groupBy('account_type')
                ->get()
                ->pluck('total_balance', 'account_type');

            $totalDebit = Account::where('pharmacy_id', $pharmacyId)
                ->active()
                ->whereIn('account_type', ['asset', 'expense'])
                ->sum('balance');

            $totalCredit = Account::where('pharmacy_id', $pharmacyId)
                ->active()
                ->whereIn('account_type', ['liability', 'equity', 'revenue'])
                ->sum('balance');

            return response()->json([
                'balances' => $balances,
                'total_debit' => (float) $totalDebit,
                'total_credit' => (float) $totalCredit,
                'is_balanced' => abs($totalDebit - $totalCredit) < 0.01,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to calculate balances.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    private function buildTree($accounts, $parentId): array
    {
        return $accounts
            ->filter(fn ($account) => $account->parent_id === $parentId)
            ->map(fn ($account) => [
                ...$account->toArray(),
                'children' => $this->buildTree($accounts, $account->id)->values()->toArray(),
            ])
            ->values()
            ->toArray();
    }
}
