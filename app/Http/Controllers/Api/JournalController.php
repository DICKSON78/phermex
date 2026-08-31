<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class JournalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $query = JournalEntry::with(['poster', 'reverser', 'lines.account'])
                ->where('pharmacy_id', $pharmacyId);

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('date_from')) {
                $query->whereDate('entry_date', '>=', $request->input('date_from'));
            }

            if ($request->filled('date_to')) {
                $query->whereDate('entry_date', '<=', $request->input('date_to'));
            }

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                      ->orWhere('entry_number', 'like', "%{$search}%");
                });
            }

            $entries = $query->latest('entry_date')->paginate($request->input('per_page', 20));

            return response()->json($entries);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch journal entries.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'entry_date' => 'required|date',
                'description' => 'required|string',
                'reference_type' => 'nullable|string',
                'reference_id' => 'nullable|integer',
                'lines' => 'required|array|min:2',
                'lines.*.account_id' => 'required|exists:accounts,id',
                'lines.*.debit' => 'required|numeric|min:0',
                'lines.*.credit' => 'required|numeric|min:0',
                'lines.*.description' => 'nullable|string',
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
            $lines = $validated['lines'];
            unset($validated['lines']);

            $totalDebit = array_sum(array_column($lines, 'debit'));
            $totalCredit = array_sum(array_column($lines, 'credit'));

            if (abs($totalDebit - $totalCredit) >= 0.01) {
                return response()->json([
                    'message' => 'Total debits must equal total credits.',
                ], 422);
            }

            $validated['entry_number'] = JournalEntry::generateEntryNumber($validated['pharmacy_id']);
            $validated['total_debit'] = $totalDebit;
            $validated['total_credit'] = $totalCredit;

            $entry = JournalEntry::create($validated);

            foreach ($lines as $line) {
                $entry->lines()->create($line);
            }

            return response()->json([
                'message' => 'Journal entry created successfully.',
                'entry' => $entry->load(['lines.account', 'poster']),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create journal entry.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $entry = JournalEntry::with(['lines.account', 'poster', 'reverser'])
                ->findOrFail($id);

            return response()->json(['entry' => $entry]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Journal entry not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch journal entry.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function post(Request $request, $id): JsonResponse
    {
        try {
            $entry = JournalEntry::findOrFail($id);

            if ($entry->status !== 'draft') {
                return response()->json([
                    'message' => 'Only draft entries can be posted.',
                ], 422);
            }

            $entry->post(Auth::id());

            return response()->json([
                'message' => 'Journal entry posted successfully.',
                'entry' => $entry->fresh()->load(['lines.account', 'poster']),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Journal entry not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to post journal entry.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function reverse(Request $request, $id): JsonResponse
    {
        try {
            $entry = JournalEntry::findOrFail($id);

            if ($entry->status !== 'posted') {
                return response()->json([
                    'message' => 'Only posted entries can be reversed.',
                ], 422);
            }

            $validator = Validator::make($request->all(), [
                'reason' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $entry->reverse(Auth::id(), $request->input('reason'));

            return response()->json([
                'message' => 'Journal entry reversed successfully.',
                'entry' => $entry->fresh()->load(['lines.account', 'reverser']),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Journal entry not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reverse journal entry.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function getTrialBalance(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');
            $asOfDate = $request->input('date', now()->toDateString());

            $accounts = Account::where('pharmacy_id', $pharmacyId)
                ->active()
                ->where('balance', '!=', 0)
                ->orderBy('account_code')
                ->get();

            $totalDebit = 0;
            $totalCredit = 0;
            $trialBalance = [];

            foreach ($accounts as $account) {
                $balance = (float) $account->balance;
                if ($balance > 0) {
                    $debit = $balance;
                    $credit = 0;
                    $totalDebit += $debit;
                } else {
                    $debit = 0;
                    $credit = abs($balance);
                    $totalCredit += $credit;
                }

                $trialBalance[] = [
                    'account_id' => $account->id,
                    'account_code' => $account->account_code,
                    'account_name' => $account->account_name,
                    'account_type' => $account->account_type,
                    'debit' => $debit,
                    'credit' => $credit,
                ];
            }

            return response()->json([
                'as_of_date' => $asOfDate,
                'accounts' => $trialBalance,
                'total_debit' => round($totalDebit, 2),
                'total_credit' => round($totalCredit, 2),
                'is_balanced' => abs($totalDebit - $totalCredit) < 0.01,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate trial balance.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function getGeneralLedger(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');
            $accountId = $request->input('account_id');
            $dateFrom = $request->input('date_from', now()->startOfYear()->toDateString());
            $dateTo = $request->input('date_to', now()->toDateString());

            $query = JournalLine::whereHas('journalEntry', function ($q) use ($pharmacyId, $dateFrom, $dateTo) {
                $q->where('pharmacy_id', $pharmacyId)
                  ->where('status', 'posted')
                  ->whereDate('entry_date', '>=', $dateFrom)
                  ->whereDate('entry_date', '<=', $dateTo);
            })->with(['account', 'journalEntry']);

            if ($accountId) {
                $query->where('account_id', $accountId);
            }

            $lines = $query->orderBy('created_at')->get();

            $runningBalance = 0;
            $ledger = $lines->map(function ($line) use (&$runningBalance) {
                $runningBalance += (float) $line->debit - (float) $line->credit;
                return [
                    'id' => $line->id,
                    'date' => $line->journalEntry->entry_date,
                    'entry_number' => $line->journalEntry->entry_number,
                    'description' => $line->description ?? $line->journalEntry->description,
                    'account_code' => $line->account->account_code,
                    'account_name' => $line->account->account_name,
                    'debit' => (float) $line->debit,
                    'credit' => (float) $line->credit,
                    'running_balance' => round($runningBalance, 2),
                ];
            });

            return response()->json([
                'ledger' => $ledger,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate general ledger.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
