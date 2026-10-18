<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Drug;
use App\Models\StockTake;
use App\Models\StockTakeItem;
use App\Support\CacheKey;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockTakeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = StockTake::with(['items.drug', 'category', 'createdBy', 'approvedBy'])
                ->where('pharmacy_id', $request->input('pharmacy_id'));

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('count_type')) {
                $query->where('count_type', $request->input('count_type'));
            }

            $takes = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($takes);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch stock takes.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $take = StockTake::with(['items.drug', 'category', 'createdBy', 'approvedBy'])
                ->findOrFail($id);

            return response()->json(['stock_take' => $take]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Stock take not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch stock take.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'title' => 'nullable|string|max:255',
                'count_type' => 'nullable|in:full,cycle',
                'category_id' => 'nullable|exists:drug_categories,id',
                'drug_ids' => 'nullable|array|min:1',
                'drug_ids.*' => 'integer',
                'notes' => 'nullable|string',
            ]);

            DB::beginTransaction();

            $take = StockTake::create([
                'pharmacy_id' => $validated['pharmacy_id'],
                'stock_take_code' => StockTake::generateStockTakeCode($validated['pharmacy_id']),
                'title' => $validated['title'] ?? null,
                'count_type' => $validated['count_type'] ?? 'full',
                'category_id' => $validated['category_id'] ?? null,
                'status' => 'draft',
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id(),
            ]);

            $drugsQuery = Drug::query()
                ->where('pharmacy_id', $validated['pharmacy_id'])
                ->where('is_published', true);

            if (! empty($validated['category_id'])) {
                $drugsQuery->where('category_id', $validated['category_id']);
            }

            if (! empty($validated['drug_ids'])) {
                $drugsQuery->whereIn('id', $validated['drug_ids']);
            }

            $drugs = $drugsQuery->get(['id', 'quantity']);

            foreach ($drugs as $drug) {
                StockTakeItem::create([
                    'stock_take_id' => $take->id,
                    'drug_id' => $drug->id,
                    'system_quantity' => $drug->quantity,
                    'variance' => 0,
                ]);
            }

            $take->update(['total_items' => $drugs->count()]);

            if ($drugs->count() > 0) {
                $take->start(Auth::id());
            }

            DB::commit();

            return response()->json([
                'message' => $drugs->count() > 0 ? 'Stock take started.' : 'Stock take created (no countable items).',
                'stock_take' => $take->load(['items.drug', 'category']),
            ], 201);
        } catch (ValidationException $e) {
            DB::rollBack();

            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Failed to create stock take.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function record(Request $request, $id): JsonResponse
    {
        try {
            $take = StockTake::findOrFail($id);

            if (in_array($take->status, ['completed', 'cancelled'])) {
                return response()->json(['message' => 'Cannot record counts on a finalized stock take.'], 422);
            }

            $validated = $request->validate([
                'items' => 'required|array|min:1',
                'items.*.drug_id' => 'required|integer',
                'items.*.counted_quantity' => 'required|integer|min:0',
                'items.*.notes' => 'nullable|string',
            ]);

            DB::beginTransaction();

            foreach ($validated['items'] as $row) {
                $item = StockTakeItem::where('stock_take_id', $take->id)
                    ->where('drug_id', $row['drug_id'])
                    ->first();

                if (! $item) {
                    DB::rollBack();

                    return response()->json([
                        'message' => 'Drug #'.$row['drug_id'].' is not part of this stock take.',
                    ], 422);
                }

                $item->update([
                    'counted_quantity' => $row['counted_quantity'],
                    'variance' => $row['counted_quantity'] - $item->system_quantity,
                    'notes' => $row['notes'] ?? $item->notes,
                ]);
            }

            $take->update(['status' => 'in_progress']);

            DB::commit();

            return response()->json([
                'message' => 'Counts recorded.',
                'stock_take' => $take->fresh(['items.drug']),
            ]);
        } catch (ModelNotFoundException) {
            DB::rollBack();

            return response()->json(['message' => 'Stock take not found.'], 404);
        } catch (ValidationException $e) {
            DB::rollBack();

            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Failed to record counts.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function complete($id): JsonResponse
    {
        try {
            $take = StockTake::findOrFail($id);

            $summary = $take->complete();

            if ($summary === false) {
                return response()->json(['message' => 'All items must be counted before completing the stock take.'], 422);
            }

            return response()->json([
                'message' => 'Stock take completed. Review the variance then approve to apply adjustments.',
                'summary' => $summary,
                'stock_take' => $take->fresh(['items.drug']),
            ]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Stock take not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to complete stock take.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function approve($id): JsonResponse
    {
        try {
            $take = StockTake::findOrFail($id);

            DB::beginTransaction();

            if (! $take->approve(Auth::id())) {
                DB::rollBack();

                return response()->json(['message' => 'Only completed stock takes can be approved.'], 422);
            }

            CacheKey::bump('drugs', 'drugs:'.$take->pharmacy_id);

            DB::commit();

            return response()->json([
                'message' => 'Adjustments applied and stock take approved.',
                'stock_take' => $take->fresh(['items.drug', 'approvedBy']),
            ]);
        } catch (ModelNotFoundException) {
            DB::rollBack();

            return response()->json(['message' => 'Stock take not found.'], 404);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Failed to approve stock take.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function cancel($id): JsonResponse
    {
        try {
            $take = StockTake::findOrFail($id);

            if (! $take->cancel()) {
                return response()->json(['message' => 'This stock take cannot be cancelled.'], 422);
            }

            return response()->json(['message' => 'Stock take cancelled.', 'stock_take' => $take]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Stock take not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to cancel stock take.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }
}
