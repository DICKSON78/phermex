<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DamagedGood;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DamagedGoodsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = DamagedGood::with(['drug', 'reportedBy'])
                ->where('pharmacy_id', $request->input('pharmacy_id'));

            if ($request->filled('reason')) {
                $query->where('reason', $request->input('reason'));
            }

            if ($request->filled('date_from')) {
                $query->where('damage_date', '>=', $request->input('date_from'));
            }

            if ($request->filled('date_to')) {
                $query->where('damage_date', '<=', $request->input('date_to'));
            }

            $damaged = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($damaged);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch damaged goods.', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'drug_id' => 'required|exists:drugs,id',
                'damage_date' => 'required|date',
                'quantity' => 'required|integer|min:1',
                'unit_cost' => 'required|numeric|min:0',
                'reason' => 'required|in:expired,damaged,contaminated,stolen,recalled',
                'notes' => 'nullable|string',
            ]);

            $damageNumber = DamagedGood::generateDamageNumber($validated['pharmacy_id']);
            $totalLoss = $validated['quantity'] * $validated['unit_cost'];

            $damaged = DamagedGood::create([
                ...$validated,
                'damage_number' => $damageNumber,
                'total_loss' => $totalLoss,
                'reported_by' => $request->user()->id,
            ]);

            $drug = \App\Models\Drug::find($validated['drug_id']);
            if ($drug) {
                $drug->decrement('quantity', $validated['quantity']);
            }

            return response()->json([
                'message' => 'Damaged goods recorded.',
                'damaged' => $damaged->load('drug', 'reportedBy'),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to record damage.', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $damaged = DamagedGood::with(['drug', 'reportedBy'])
                ->findOrFail($id);

            return response()->json(['damaged' => $damaged]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Record not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch record.', 'error' => $e->getMessage()], 500);
        }
    }

    public function process(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'disposal_method' => 'required|in:returned_to_supplier,documented_disposal,donated',
            ]);

            $damaged = DamagedGood::findOrFail($id);
            $damaged->process($validated['disposal_method']);

            return response()->json([
                'message' => 'Disposal recorded.',
                'damaged' => $damaged->fresh(),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Record not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to process.', 'error' => $e->getMessage()], 500);
        }
    }

    public function getReport(Request $request): JsonResponse
    {
        try {
            $pharmacyId = $request->input('pharmacy_id');
            $query = DamagedGood::where('pharmacy_id', $pharmacyId);

            if ($request->filled('date_from')) {
                $query->where('damage_date', '>=', $request->input('date_from'));
            }
            if ($request->filled('date_to')) {
                $query->where('damage_date', '<=', $request->input('date_to'));
            }

            $records = $query->get();

            $byReason = $records->groupBy('reason')->map(fn ($items) => [
                'count' => $items->count(),
                'total_loss' => $items->sum('total_loss'),
            ]);

            return response()->json([
                'total_records' => $records->count(),
                'total_loss' => $records->sum('total_loss'),
                'by_reason' => $byReason,
                'by_month' => $records->groupBy(fn ($r) => $r->damage_date->format('Y-m'))
                    ->map(fn ($items) => ['count' => $items->count(), 'total_loss' => $items->sum('total_loss')]),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to generate report.', 'error' => $e->getMessage()], 500);
        }
    }
}
