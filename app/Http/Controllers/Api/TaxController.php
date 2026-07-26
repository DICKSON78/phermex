<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TaxRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TaxController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $query = TaxRecord::where('pharmacy_id', $pharmacyId);

            if ($request->filled('tax_type')) {
                $query->where('tax_type', $request->input('tax_type'));
            }

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('year')) {
                $query->where('period_year', $request->input('year'));
            }

            if ($request->filled('month')) {
                $query->where('period_month', $request->input('month'));
            }

            $records = $query->orderByDesc('period_year')
                ->orderByDesc('period_month')
                ->paginate($request->input('per_page', 20));

            return response()->json($records);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch tax records.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'tax_type' => 'required|in:VAT,PAYE,NSSF,NHIF,Housing',
                'period_month' => 'required|integer|min:1|max:12',
                'period_year' => 'required|integer|min:2020|max:2100',
                'taxable_amount' => 'required|numeric|min:0',
                'tax_amount' => 'nullable|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $validated = $validator->validated();

            $exists = TaxRecord::where('pharmacy_id', $validated['pharmacy_id'])
                ->where('tax_type', $validated['tax_type'])
                ->where('period_month', $validated['period_month'])
                ->where('period_year', $validated['period_year'])
                ->exists();

            if ($exists) {
                return response()->json([
                    'message' => 'Tax record already exists for this period and type.',
                ], 422);
            }

            $record = new TaxRecord($validated);
            if (empty($validated['tax_amount'])) {
                $record->calculate();
            }
            $record->save();

            return response()->json([
                'message' => 'Tax record created successfully.',
                'record' => $record,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create tax record.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function calculate(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'tax_type' => 'required|in:VAT,PAYE,NSSF,NHIF,Housing',
                'period_month' => 'required|integer|min:1|max:12',
                'period_year' => 'required|integer|min:2020|max:2100',
                'taxable_amount' => 'required|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $validated = $validator->validated();
            $rate = TaxRecord::getTaxRate($validated['tax_type']);
            $taxAmount = ($validated['taxable_amount'] * $rate) / 100;

            return response()->json([
                'tax_type' => $validated['tax_type'],
                'taxable_amount' => (float) $validated['taxable_amount'],
                'tax_rate' => $rate,
                'tax_amount' => round($taxAmount, 2),
                'total' => round($validated['taxable_amount'] + $taxAmount, 2),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to calculate tax.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function file($id): JsonResponse
    {
        try {
            $record = TaxRecord::findOrFail($id);

            if ($record->status !== 'draft') {
                return response()->json([
                    'message' => 'Only draft records can be filed.',
                ], 422);
            }

            $record->file();

            return response()->json([
                'message' => 'Tax record filed successfully.',
                'record' => $record->fresh(),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Tax record not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to file tax record.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function markPaid(Request $request, $id): JsonResponse
    {
        try {
            $record = TaxRecord::findOrFail($id);

            if ($record->status !== 'filed') {
                return response()->json([
                    'message' => 'Only filed records can be marked as paid.',
                ], 422);
            }

            $validator = Validator::make($request->all(), [
                'receipt_number' => 'required|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $record->markPaid($request->input('receipt_number'));

            return response()->json([
                'message' => 'Tax record marked as paid.',
                'record' => $record->fresh(),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Tax record not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update tax record.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getCalendar(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');
            $year = $request->input('year', now()->year);

            $records = TaxRecord::where('pharmacy_id', $pharmacyId)
                ->where('period_year', $year)
                ->get();

            $taxTypes = ['VAT', 'PAYE', 'NSSF', 'NHIF', 'Housing'];
            $calendar = [];

            foreach ($taxTypes as $type) {
                for ($month = 1; $month <= 12; $month++) {
                    $record = $records->first(
                        fn ($r) => $r->tax_type === $type && $r->period_month === $month
                    );

                    $deadlineDay = match ($type) {
                        'VAT' => 20,
                        'PAYE' => 15,
                        'NSSF' => 15,
                        'NHIF' => 15,
                        'Housing' => 9,
                        default => 15,
                    };

                    $deadline = "$year-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-" . str_pad($deadlineDay, 2, '0', STR_PAD_LEFT);
                    $isPast = strtotime($deadline) < time();

                    $calendar[] = [
                        'tax_type' => $type,
                        'period_month' => $month,
                        'period_year' => $year,
                        'deadline' => $deadline,
                        'status' => $record?->status ?? 'none',
                        'tax_amount' => $record ? (float) $record->tax_amount : null,
                        'is_overdue' => $isPast && (!$record || $record->status !== 'paid'),
                    ];
                }
            }

            return response()->json(['calendar' => $calendar]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate tax calendar.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getSummary(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');
            $year = $request->input('year', now()->year);

            $records = TaxRecord::where('pharmacy_id', $pharmacyId)
                ->where('period_year', $year)
                ->get();

            $byType = $records->groupBy('tax_type')->map(function ($items, $type) {
                return [
                    'tax_type' => $type,
                    'total_taxable' => $items->sum('taxable_amount'),
                    'total_tax' => $items->sum('tax_amount'),
                    'count' => $items->count(),
                    'filed' => $items->where('status', 'filed')->count(),
                    'paid' => $items->where('status', 'paid')->count(),
                    'draft' => $items->where('status', 'draft')->count(),
                ];
            })->values();

            $totalLiability = $records->sum('tax_amount');
            $totalPaid = $records->where('status', 'paid')->sum('tax_amount');
            $totalPending = $totalLiability - $totalPaid;

            return response()->json([
                'year' => (int) $year,
                'total_liability' => (float) $totalLiability,
                'total_paid' => (float) $totalPaid,
                'total_pending' => (float) $totalPending,
                'by_type' => $byType,
                'records_count' => $records->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate tax summary.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
