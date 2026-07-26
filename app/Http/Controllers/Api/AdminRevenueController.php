<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RevenueRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminRevenueController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = RevenueRecord::with('pharmacy');

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('type')) {
                $query->where('type', $request->input('type'));
            }

            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->input('date_from'));
            }

            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->input('date_to'));
            }

            if ($request->filled('pharmacy_id')) {
                $query->where('pharmacy_id', $request->input('pharmacy_id'));
            }

            $records = $query->latest()->paginate($request->input('per_page', 20));

            $summary = [
                'total' => (float) RevenueRecord::sum('amount'),
                'paid' => (float) RevenueRecord::where('status', 'paid')->sum('amount'),
                'pending' => (float) RevenueRecord::where('status', 'pending')->sum('amount'),
                'overdue' => (float) RevenueRecord::where('status', 'overdue')->sum('amount'),
                'cancelled' => (float) RevenueRecord::where('status', 'cancelled')->sum('amount'),
                'count' => RevenueRecord::count(),
                'by_type' => RevenueRecord::select('type', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
                    ->groupBy('type')
                    ->pluck('total', 'type')
                    ->toArray(),
            ];

            $records->setCollection(
                $records->getCollection()->map(function ($record) {
                    return [
                        'id' => $record->id,
                        'pharmacy_id' => $record->pharmacy_id,
                        'pharmacy_name' => $record->pharmacy?->pharmacy_name,
                        'type' => $record->type,
                        'amount' => (float) $record->amount,
                        'description' => $record->description,
                        'invoice_number' => $record->invoice_number,
                        'status' => $record->status,
                        'due_date' => $record->due_date?->format('Y-m-d'),
                        'paid_at' => $record->paid_at?->toISOString(),
                        'payment_method' => $record->payment_method,
                        'notes' => $record->notes,
                        'created_at' => $record->created_at->toISOString(),
                    ];
                })
            );

            return response()->json([
                'data' => $records->items(),
                'summary' => $summary,
                'meta' => [
                    'current_page' => $records->currentPage(),
                    'last_page' => $records->lastPage(),
                    'per_page' => $records->perPage(),
                    'total' => $records->total(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch revenue records.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'nullable|exists:pharmacies,id',
                'type' => 'required|in:subscription,commission,service',
                'amount' => 'required|numeric|min:0.01',
                'description' => 'nullable|string|max:500',
                'status' => 'sometimes|in:pending,paid,overdue,cancelled',
                'due_date' => 'required|date',
                'payment_method' => 'nullable|string|max:50',
                'notes' => 'nullable|string|max:1000',
            ]);

            $validated['invoice_number'] = RevenueRecord::generateInvoiceNumber();
            $validated['status'] = $validated['status'] ?? 'pending';

            if ($validated['status'] === 'paid') {
                $validated['paid_at'] = now();
            }

            $record = RevenueRecord::create($validated);

            return response()->json([
                'message' => 'Revenue record created.',
                'data' => $record->load('pharmacy'),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create revenue record.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $record = RevenueRecord::with('pharmacy')->findOrFail($id);

            return response()->json(['data' => $record]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Revenue record not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch revenue record.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $record = RevenueRecord::findOrFail($id);
            $record->delete();

            return response()->json(['message' => 'Revenue record deleted.']);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Revenue record not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete revenue record.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $record = RevenueRecord::findOrFail($id);

            $validated = $request->validate([
                'status' => 'required|in:pending,paid,overdue,cancelled',
                'payment_method' => 'nullable|string|max:50',
                'notes' => 'nullable|string|max:1000',
            ]);

            if ($validated['status'] === 'paid' && $record->status !== 'paid') {
                $validated['paid_at'] = now();
            }

            $record->update($validated);

            return response()->json([
                'message' => 'Revenue record updated.',
                'data' => $record->fresh()->load('pharmacy'),
            ]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Revenue record not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update revenue record.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function reminder(Request $request, $id): JsonResponse
    {
        try {
            $record = RevenueRecord::findOrFail($id);

            if ($record->status !== 'pending' && $record->status !== 'overdue') {
                return response()->json([
                    'message' => 'Can only send reminders for pending or overdue records.',
                ], 400);
            }

            $record->update(['notes' => ($record->notes ? $record->notes . "\n" : '') . 'Payment reminder sent on ' . now()->format('Y-m-d H:i')]);

            return response()->json([
                'message' => 'Payment reminder recorded.',
                'data' => $record->fresh(),
            ]);
        } catch (\Illuminate\Database\ModelNotFoundException) {
            return response()->json(['message' => 'Revenue record not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send reminder.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
