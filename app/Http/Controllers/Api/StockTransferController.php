<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockTransferController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = StockTransfer::with(['requestedBy', 'approvedBy'])
                ->where('pharmacy_id', $request->input('pharmacy_id'));

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            $transfers = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($transfers);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch transfers.', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'from_location' => 'required|string|max:255',
                'to_location' => 'required|string|max:255',
                'notes' => 'nullable|string',
                'items' => 'required|array|min:1',
                'items.*.drug_id' => 'required|exists:drugs,id',
                'items.*.quantity_sent' => 'required|integer|min:1',
                'items.*.batch_number' => 'nullable|string',
                'items.*.expiry_date' => 'nullable|date',
                'items.*.notes' => 'nullable|string',
            ]);

            $transferNumber = StockTransfer::generateTransferNumber($validated['pharmacy_id']);
            $totalItems = 0;
            $totalValue = 0;

            foreach ($validated['items'] as $item) {
                $drug = \App\Models\Drug::findOrFail($item['drug_id']);
                $totalItems += $item['quantity_sent'];
                $totalValue += $item['quantity_sent'] * $drug->buying_price;
            }

            $transfer = DB::transaction(function () use ($validated, $transferNumber, $totalItems, $totalValue, $request) {
                $transfer = StockTransfer::create([
                    'pharmacy_id' => $validated['pharmacy_id'],
                    'transfer_number' => $transferNumber,
                    'from_location' => $validated['from_location'],
                    'to_location' => $validated['to_location'],
                    'status' => 'pending',
                    'total_items' => $totalItems,
                    'total_value' => $totalValue,
                    'requested_by' => $request->user()->id,
                    'notes' => $validated['notes'] ?? null,
                ]);

                foreach ($validated['items'] as $item) {
                    StockTransferItem::create([
                        'stock_transfer_id' => $transfer->id,
                        'drug_id' => $item['drug_id'],
                        'quantity_sent' => $item['quantity_sent'],
                        'batch_number' => $item['batch_number'] ?? null,
                        'expiry_date' => $item['expiry_date'] ?? null,
                        'notes' => $item['notes'] ?? null,
                    ]);
                }

                return $transfer;
            });

            return response()->json([
                'message' => 'Stock transfer created.',
                'transfer' => $transfer->load('items.drug', 'requestedBy'),
            ], 201);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Drug not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create transfer.', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $transfer = StockTransfer::with(['items.drug', 'requestedBy', 'approvedBy'])
                ->findOrFail($id);

            return response()->json(['transfer' => $transfer]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Transfer not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch transfer.', 'error' => $e->getMessage()], 500);
        }
    }

    public function approve(Request $request, $id): JsonResponse
    {
        try {
            $transfer = StockTransfer::findOrFail($id);

            if (!$transfer->approve($request->user())) {
                return response()->json(['message' => 'Cannot approve this transfer.'], 422);
            }

            return response()->json(['message' => 'Transfer approved.', 'transfer' => $transfer->fresh()]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Transfer not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to approve transfer.', 'error' => $e->getMessage()], 500);
        }
    }

    public function ship($id): JsonResponse
    {
        try {
            $transfer = StockTransfer::findOrFail($id);

            if (!$transfer->ship()) {
                return response()->json(['message' => 'Cannot ship this transfer.'], 422);
            }

            DB::transaction(function () use ($transfer) {
                foreach ($transfer->items as $item) {
                    $drug = \App\Models\Drug::find($item->drug_id);
                    if ($drug) {
                        $drug->decrement('quantity', $item->quantity_sent);
                    }
                }
            });

            return response()->json(['message' => 'Transfer shipped.', 'transfer' => $transfer->fresh()]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Transfer not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to ship transfer.', 'error' => $e->getMessage()], 500);
        }
    }

    public function receive(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'items' => 'sometimes|array',
                'items.*.id' => 'required|exists:stock_transfer_items,id',
                'items.*.quantity_received' => 'required|integer|min:0',
            ]);

            $transfer = StockTransfer::findOrFail($id);

            DB::transaction(function () use ($transfer, $validated) {
                if (isset($validated['items'])) {
                    foreach ($validated['items'] as $itemData) {
                        $item = StockTransferItem::findOrFail($itemData['id']);
                        $item->update(['quantity_received' => $itemData['quantity_received']]);
                    }
                } else {
                    foreach ($transfer->items as $item) {
                        $item->update(['quantity_received' => $item->quantity_sent]);
                    }
                }

                $transfer->receive();
            });

            return response()->json(['message' => 'Transfer received.', 'transfer' => $transfer->fresh()->load('items.drug')]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Transfer not found.'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to receive transfer.', 'error' => $e->getMessage()], 500);
        }
    }

    public function cancel($id): JsonResponse
    {
        try {
            $transfer = StockTransfer::findOrFail($id);

            if (!$transfer->cancel()) {
                return response()->json(['message' => 'Cannot cancel this transfer.'], 422);
            }

            return response()->json(['message' => 'Transfer cancelled.', 'transfer' => $transfer->fresh()]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Transfer not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to cancel transfer.', 'error' => $e->getMessage()], 500);
        }
    }
}
