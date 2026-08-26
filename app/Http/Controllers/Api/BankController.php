<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\BankTransaction;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class BankController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $accounts = BankAccount::where('pharmacy_id', $pharmacyId)
                ->with('account')
                ->orderByDesc('is_default')
                ->orderBy('bank_name')
                ->get();

            return response()->json(['accounts' => $accounts]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch bank accounts.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'account_id' => 'nullable|exists:accounts,id',
                'bank_name' => 'required|string|max:255',
                'account_name' => 'required|string|max:255',
                'account_number' => 'required|string|max:50',
                'swift_code' => 'nullable|string|max:20',
                'opening_balance' => 'nullable|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $validated = $validator->validated();
            $validated['current_balance'] = $validated['opening_balance'] ?? 0;

            if (!BankAccount::where('pharmacy_id', $request->pharmacy_id)->exists()) {
                $validated['is_default'] = true;
            }

            $bankAccount = BankAccount::create($validated);

            return response()->json([
                'message' => 'Bank account created successfully.',
                'account' => $bankAccount,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create bank account.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $account = BankAccount::with(['account', 'transactions.journalEntry'])
                ->findOrFail($id);

            return response()->json(['account' => $account]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Bank account not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch bank account.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function getTransactions(Request $request, $id): JsonResponse
    {
        try {
            $bankAccount = BankAccount::findOrFail($id);

            $query = BankTransaction::where('bank_account_id', $id);

            if ($request->filled('type')) {
                $query->where('type', $request->input('type'));
            }

            if ($request->filled('date_from')) {
                $query->whereDate('transaction_date', '>=', $request->input('date_from'));
            }

            if ($request->filled('date_to')) {
                $query->whereDate('transaction_date', '<=', $request->input('date_to'));
            }

            if ($request->has('reconciled')) {
                $query->where('reconciled', $request->boolean('reconciled'));
            }

            $transactions = $query->with('journalEntry')
                ->latest('transaction_date')
                ->paginate($request->input('per_page', 20));

            return response()->json($transactions);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Bank account not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch transactions.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function reconcile(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'transaction_ids' => 'required|array',
                'transaction_ids.*' => 'exists:bank_transactions,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $bankAccount = BankAccount::findOrFail($id);
            $reconciledCount = 0;

            foreach ($request->input('transaction_ids') as $transactionId) {
                if ($bankAccount->reconcile($transactionId)) {
                    $reconciledCount++;
                }
            }

            return response()->json([
                'message' => "{$reconciledCount} transactions reconciled successfully.",
                'reconciled_count' => $reconciledCount,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Bank account not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reconcile transactions.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function getSummary(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $accounts = BankAccount::where('pharmacy_id', $pharmacyId)
                ->where('is_active', true)
                ->get();

            $totalBalance = $accounts->sum('current_balance');
            $totalOpening = $accounts->sum('opening_balance');
            $defaultAccount = $accounts->firstWhere('is_default', true);

            return response()->json([
                'total_balance' => (float) $totalBalance,
                'total_opening_balance' => (float) $totalOpening,
                'account_count' => $accounts->count(),
                'default_account' => $defaultAccount,
                'accounts' => $accounts->map(fn ($a) => [
                    'id' => $a->id,
                    'bank_name' => $a->bank_name,
                    'account_name' => $a->account_name,
                    'current_balance' => (float) $a->current_balance,
                    'is_default' => $a->is_default,
                ]),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate bank summary.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function transfer(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'from_bank_account_id' => 'required|exists:bank_accounts,id',
                'to_bank_account_id' => 'required|exists:bank_accounts,id|different:from_bank_account_id',
                'amount' => 'required|numeric|min:0.01',
                'description' => 'required|string',
                'transfer_date' => 'required|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $fromAccount = BankAccount::findOrFail($request->from_bank_account_id);
            $toAccount = BankAccount::findOrFail($request->to_bank_account_id);

            if ((float) $fromAccount->current_balance < (float) $request->amount) {
                return response()->json([
                    'message' => 'Insufficient balance in source account.',
                ], 422);
            }

            DB::beginTransaction();
            try {
                $entry = JournalEntry::create([
                    'pharmacy_id' => $request->pharmacy_id,
                    'entry_number' => JournalEntry::generateEntryNumber($request->pharmacy_id),
                    'entry_date' => $request->transfer_date,
                    'description' => "Bank transfer: {$fromAccount->bank_name} to {$toAccount->bank_name} - {$request->description}",
                    'total_debit' => $request->amount,
                    'total_credit' => $request->amount,
                    'status' => 'posted',
                    'posted_by' => Auth::id(),
                    'posted_at' => now(),
                ]);

                $amount = $request->amount;
                $newFromBalance = (float) $fromAccount->current_balance - $amount;
                $newToBalance = (float) $toAccount->current_balance + $amount;

                BankTransaction::create([
                    'bank_account_id' => $fromAccount->id,
                    'journal_entry_id' => $entry->id,
                    'transaction_date' => $request->transfer_date,
                    'type' => 'transfer',
                    'amount' => -$amount,
                    'balance_after' => $newFromBalance,
                    'description' => "Transfer to {$toAccount->bank_name} - {$request->description}",
                    'reference_number' => $entry->entry_number,
                ]);

                BankTransaction::create([
                    'bank_account_id' => $toAccount->id,
                    'journal_entry_id' => $entry->id,
                    'transaction_date' => $request->transfer_date,
                    'type' => 'transfer',
                    'amount' => $amount,
                    'balance_after' => $newToBalance,
                    'description' => "Transfer from {$fromAccount->bank_name} - {$request->description}",
                    'reference_number' => $entry->entry_number,
                ]);

                $fromAccount->update(['current_balance' => $newFromBalance]);
                $toAccount->update(['current_balance' => $newToBalance]);

                DB::commit();

                return response()->json([
                    'message' => 'Transfer completed successfully.',
                    'journal_entry' => $entry->load(['lines.account']),
                ], 201);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to complete transfer.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
