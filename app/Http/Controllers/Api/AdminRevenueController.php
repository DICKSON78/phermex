<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy;
use App\Models\RevenueRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminRevenueController extends Controller
{
    private const TITLE_STATUS = [
        'pending' => 'Pending',
        'paid' => 'Paid',
        'overdue' => 'Overdue',
        'cancelled' => 'Void',
    ];

    private function normalizeStatus(?string $status): string
    {
        $status = strtolower(trim((string) $status));

        if ($status === '' || $status === 'void') {
            return 'pending';
        }

        if ($status === 'cancelled') {
            return 'cancelled';
        }

        return in_array($status, ['pending', 'paid', 'overdue', 'cancelled'], true) ? $status : 'pending';
    }

    private function titleStatus(string $status): string
    {
        return self::TITLE_STATUS[$status] ?? ucfirst($status);
    }

    private function toApi(RevenueRecord $record): array
    {
        return [
            'id' => $record->id,
            'pharmacy_id' => $record->pharmacy_id,
            'pharmacy' => $record->pharmacy_name ?: $record->pharmacy?->pharmacy_name,
            'type' => $record->type,
            'amount' => (float) $record->amount,
            'description' => $record->description,
            'invoiceNumber' => $record->invoice_number,
            'status' => $this->titleStatus($record->status),
            'dueDate' => $record->due_date?->format('Y-m-d'),
            'paidDate' => $record->paid_at?->toISOString(),
            'paymentMethod' => $record->payment_method,
            'notes' => $record->notes,
            'createdAt' => $record->created_at->toISOString(),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = RevenueRecord::with('pharmacy');

            if ($request->filled('status')) {
                $query->where('status', $this->normalizeStatus($request->input('status')));
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

            $records = $query->latest()->paginate($request->input('per_page', 50));

            $invoices = $records->getCollection()->map(fn ($record) => $this->toApi($record))->values();

            $pending = (float) RevenueRecord::where('status', 'pending')->sum('amount');
            $overdue = (float) RevenueRecord::where('status', 'overdue')->sum('amount');
            $paid = (float) RevenueRecord::where('status', 'paid')->sum('amount');
            $cancelled = (float) RevenueRecord::where('status', 'cancelled')->sum('amount');

            $summary = [
                'total' => (float) RevenueRecord::sum('amount'),
                'paid' => $paid,
                'pending' => $pending,
                'overdue' => $overdue,
                'cancelled' => $cancelled,
                'count' => RevenueRecord::count(),
                'by_type' => RevenueRecord::select('type', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
                    ->groupBy('type')
                    ->pluck('total', 'type')
                    ->toArray(),
            ];

            $stats = [
                'totalRevenue' => $paid,
                'pending' => $pending,
                'overdue' => $overdue,
                'thisMonth' => (float) RevenueRecord::where('status', 'paid')
                    ->where('paid_at', '>=', now()->startOfMonth())
                    ->sum('amount'),
                'total' => $summary['total'],
                'paid' => $paid,
                'cancelled' => $cancelled,
            ];

            $revenueTrend = [];
            for ($i = 5; $i >= 0; $i--) {
                $month = now()->subMonths($i);
                $revenueTrend[] = [
                    'month' => $month->format('M'),
                    'revenue' => (float) RevenueRecord::where('status', 'paid')
                        ->where('paid_at', '>=', $month->copy()->startOfMonth())
                        ->where('paid_at', '<=', $month->copy()->endOfMonth())
                        ->sum('amount'),
                ];
            }

            return response()->json([
                'invoices' => $invoices,
                'data' => $invoices,
                'stats' => $stats,
                'summary' => $summary,
                'revenueTrend' => $revenueTrend,
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
                'pharmacy' => 'nullable|string|max:255',
                'pharmacy_id' => 'nullable|exists:pharmacies,id',
                'type' => 'sometimes|in:subscription,commission,service',
                'amount' => 'required|numeric|min:0.01',
                'description' => 'nullable|string|max:500',
                'dueDate' => 'required|date',
                'notes' => 'nullable|string|max:1000',
                'status' => 'sometimes|string|max:20',
            ]);

            $pharmacyId = $validated['pharmacy_id'] ?? null;
            $pharmacyName = $validated['pharmacy'] ?? null;

            if (!$pharmacyId && $pharmacyName) {
                $pharmacy = Pharmacy::where('pharmacy_name', $pharmacyName)->first();
                if ($pharmacy) {
                    $pharmacyId = $pharmacy->id;
                }
            } elseif ($pharmacyId) {
                $pharmacyName = $pharmacyName ?: Pharmacy::find($pharmacyId)?->pharmacy_name;
            }

            $status = $this->normalizeStatus($validated['status'] ?? 'pending');

            $record = RevenueRecord::create([
                'pharmacy_id' => $pharmacyId,
                'pharmacy_name' => $pharmacyName,
                'type' => $validated['type'] ?? 'service',
                'amount' => $validated['amount'],
                'description' => $validated['description'] ?? null,
                'invoice_number' => RevenueRecord::generateInvoiceNumber(),
                'status' => $status,
                'due_date' => $validated['dueDate'],
                'paid_at' => $status === 'paid' ? now() : null,
                'notes' => $validated['notes'] ?? null,
            ]);

            return response()->json([
                'message' => 'Revenue record created.',
                'data' => $this->toApi($record->load('pharmacy')),
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

            return response()->json(['data' => $this->toApi($record)]);
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
                'status' => 'sometimes|string|max:20',
                'payment_method' => 'nullable|string|max:50',
                'notes' => 'nullable|string|max:1000',
                'amount' => 'sometimes|numeric|min:0.01',
                'dueDate' => 'sometimes|date',
                'pharmacy' => 'nullable|string|max:255',
            ]);

            $data = [];

            if (isset($validated['status'])) {
                $status = $this->normalizeStatus($validated['status']);
                $data['status'] = $status;

                if ($status === 'paid' && $record->status !== 'paid') {
                    $data['paid_at'] = now();
                } elseif ($status !== 'paid') {
                    $data['paid_at'] = null;
                }
            }

            if (array_key_exists('payment_method', $validated)) {
                $data['payment_method'] = $validated['payment_method'];
            }

            if (array_key_exists('notes', $validated)) {
                $data['notes'] = $validated['notes'];
            }

            if (array_key_exists('amount', $validated)) {
                $data['amount'] = $validated['amount'];
            }

            if (isset($validated['dueDate'])) {
                $data['due_date'] = $validated['dueDate'];
            }

            if (isset($validated['pharmacy'])) {
                $data['pharmacy_name'] = $validated['pharmacy'];
                $pharmacy = Pharmacy::where('pharmacy_name', $validated['pharmacy'])->first();
                if ($pharmacy) {
                    $data['pharmacy_id'] = $pharmacy->id;
                }
            }

            $record->update($data);

            return response()->json([
                'message' => 'Revenue record updated.',
                'data' => $this->toApi($record->fresh()->load('pharmacy')),
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
                'data' => $this->toApi($record->fresh()),
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
