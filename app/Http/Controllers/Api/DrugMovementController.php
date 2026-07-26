<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Drug;
use App\Models\DrugMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DrugMovementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');

            $query = DrugMovement::with(['drug', 'performer'])
                ->when($pharmacyId, fn ($q) => $q->where('pharmacy_id', $pharmacyId));

            if ($request->filled('type')) {
                $query->where('movement_type', $request->input('type'));
            }

            if ($request->filled('drug_id')) {
                $query->where('drug_id', $request->input('drug_id'));
            }

            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->input('date_from'));
            }

            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->input('date_to'));
            }

            $movements = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($movements);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch stock movements.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'drug_id' => 'required|exists:drugs,id',
                'movement_type' => 'required|in:purchase,adjustment,return,expiry,transfer',
                'quantity' => 'required|integer',
                'unit_cost' => 'nullable|numeric|min:0',
                'reference_number' => 'nullable|string|max:255',
                'notes' => 'nullable|string',
            ]);

            DB::beginTransaction();

            $drug = Drug::lockForUpdate()->findOrFail($validated['drug_id']);

            if ($validated['movement_type'] === 'adjustment' || $validated['movement_type'] === 'return') {
                if ($validated['quantity'] < 0) {
                    $drug->increment('quantity', abs($validated['quantity']));
                    $validated['quantity'] = abs($validated['quantity']);
                } else {
                    $drug->increment('quantity', $validated['quantity']);
                }
            } elseif ($validated['movement_type'] === 'purchase' || $validated['movement_type'] === 'transfer') {
                $drug->increment('quantity', abs($validated['quantity']));
                $validated['quantity'] = abs($validated['quantity']);
            } elseif ($validated['movement_type'] === 'expiry') {
                $drug->decrement('quantity', abs($validated['quantity']));
                $validated['quantity'] = -abs($validated['quantity']);
            }

            $validated['performed_by'] = Auth::id();

            $movement = DrugMovement::create($validated);

            DB::commit();

            return response()->json([
                'message' => 'Stock movement recorded successfully.',
                'movement' => $movement->load(['drug', 'performer']),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to record stock movement.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $movement = DrugMovement::with(['drug', 'performer'])->findOrFail($id);

            return response()->json([
                'movement' => $movement,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Movement not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch movement.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function monthlySummary(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');
            $year = $request->input('year', now()->year);
            $month = $request->input('month', now()->month);

            $query = DrugMovement::where('pharmacy_id', $pharmacyId)
                ->whereYear('created_at', $year)
                ->whereMonth('created_at', $month);

            $totalMovements = (clone $query)->count();
            $typeBreakdown = (clone $query)
                ->select('movement_type', DB::raw('COUNT(*) as count'), DB::raw('SUM(ABS(quantity)) as total_quantity'))
                ->groupBy('movement_type')
                ->get();

            $dailyMovements = (clone $query)
                ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            return response()->json([
                'year' => (int) $year,
                'month' => (int) $month,
                'total_movements' => $totalMovements,
                'type_breakdown' => $typeBreakdown,
                'daily_movements' => $dailyMovements,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to generate monthly summary.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
