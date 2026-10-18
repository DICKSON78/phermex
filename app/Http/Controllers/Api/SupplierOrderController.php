<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Drug;
use App\Models\DrugMovement;
use App\Models\SupplierOrder;
use App\Models\SupplierOrderItem;
use App\Support\CacheKey;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SupplierOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = SupplierOrder::with(['supplier', 'items'])
                ->where('pharmacy_id', $request->input('pharmacy_id'));

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('supplier_id')) {
                $query->where('supplier_id', $request->input('supplier_id'));
            }

            $orders = $query->latest()->paginate($request->input('per_page', 20));

            return response()->json($orders);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch supplier orders.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $order = SupplierOrder::with(['supplier', 'items.drug', 'createdBy', 'approvedBy', 'completedBy'])
                ->findOrFail($id);

            return response()->json(['supplier_order' => $order]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Supplier order not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch supplier order.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'pharmacy_id' => 'required|exists:pharmacies,id',
                'supplier_id' => 'required|exists:suppliers,id',
                'notes' => 'nullable|string',
                'items' => 'required|array|min:1',
                'items.*.drug_id' => 'required|exists:drugs,id',
                'items.*.quantity_ordered' => 'required|integer|min:1',
                'items.*.buying_price' => 'nullable|numeric|min:0',
                'items.*.selling_price' => 'nullable|numeric|min:0',
                'items.*.expiry_date' => 'nullable|date',
                'items.*.batch_number' => 'nullable|string',
            ]);

            $drugIds = array_column($validated['items'], 'drug_id');
            $drugs = Drug::query()
                ->where('pharmacy_id', $validated['pharmacy_id'])
                ->whereIn('id', $drugIds)
                ->get()
                ->keyBy('id');

            if (count($drugs) !== count(array_unique($drugIds))) {
                return response()->json([
                    'message' => 'Some drugs do not belong to this pharmacy.',
                    'errors' => ['items' => ['Each drug must exist in this pharmacy\'s catalog.']],
                ], 422);
            }

            DB::beginTransaction();

            $order = SupplierOrder::create([
                'pharmacy_id' => $validated['pharmacy_id'],
                'supplier_id' => $validated['supplier_id'],
                'order_code' => SupplierOrder::generateOrderCode($validated['pharmacy_id']),
                'status' => 'submitted',
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id(),
            ]);

            foreach ($validated['items'] as $row) {
                $drug = $drugs->get($row['drug_id']);

                SupplierOrderItem::create([
                    'supplier_order_id' => $order->id,
                    'drug_id' => $drug->id,
                    'drug_name' => $drug->name,
                    'manufacturer' => $drug->manufacturer,
                    'barcode' => $drug->barcode,
                    'quantity_ordered' => $row['quantity_ordered'],
                    'buying_price' => $row['buying_price'] ?? null,
                    'selling_price' => $row['selling_price'] ?? null,
                    'expiry_date' => $row['expiry_date'] ?? null,
                    'batch_number' => $row['batch_number'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Supplier order submitted.',
                'supplier_order' => $order->load(['supplier', 'items.drug']),
            ], 201);
        } catch (ValidationException $e) {
            DB::rollBack();

            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Failed to create supplier order.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $order = SupplierOrder::with('items')->findOrFail($id);

            if (in_array($order->status, ['completed', 'cancelled'])) {
                return response()->json(['message' => 'A finalized order cannot be edited.'], 422);
            }

            $validated = $request->validate([
                'notes' => 'nullable|string',
                'items' => 'nullable|array|min:1',
                'items.*.id' => 'required|integer',
                'items.*.quantity_ordered' => 'nullable|integer|min:1',
                'items.*.buying_price' => 'nullable|numeric|min:0',
                'items.*.selling_price' => 'nullable|numeric|min:0',
                'items.*.expiry_date' => 'nullable|date',
                'items.*.batch_number' => 'nullable|string',
            ]);

            $itemIds = $order->items->pluck('id')->all();

            DB::beginTransaction();

            foreach ($validated['items'] ?? [] as $row) {
                if (! in_array($row['id'], $itemIds)) {
                    DB::rollBack();

                    return response()->json([
                        'message' => 'Item #'.$row['id'].' is not part of this order.',
                    ], 422);
                }

                $item = $order->items->firstWhere('id', $row['id']);

                $item->update([
                    'quantity_ordered' => $row['quantity_ordered'] ?? $item->quantity_ordered,
                    'buying_price' => array_key_exists('buying_price', $row) ? $row['buying_price'] : $item->buying_price,
                    'selling_price' => array_key_exists('selling_price', $row) ? $row['selling_price'] : $item->selling_price,
                    'expiry_date' => $row['expiry_date'] ?? $item->expiry_date,
                    'batch_number' => $row['batch_number'] ?? $item->batch_number,
                ]);
            }

            if (array_key_exists('notes', $validated)) {
                $order->update(['notes' => $validated['notes'] !== null ? $validated['notes'] : $order->notes]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Supplier order updated.',
                'supplier_order' => $order->fresh(['supplier', 'items.drug']),
            ]);
        } catch (ModelNotFoundException) {
            DB::rollBack();

            return response()->json(['message' => 'Supplier order not found.'], 404);
        } catch (ValidationException $e) {
            DB::rollBack();

            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Failed to update supplier order.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function submit($id): JsonResponse
    {
        try {
            $order = SupplierOrder::findOrFail($id);

            if (! $order->submit()) {
                return response()->json(['message' => 'Cannot submit this order.'], 422);
            }

            return response()->json(['message' => 'Supplier order submitted.', 'supplier_order' => $order->fresh(['supplier', 'items.drug'])]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Supplier order not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to submit supplier order.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function approve($id): JsonResponse
    {
        try {
            $order = SupplierOrder::findOrFail($id);

            if (! $order->approve(Auth::id())) {
                return response()->json(['message' => 'Only submitted orders can be approved.'], 422);
            }

            return response()->json(['message' => 'Supplier order approved.', 'supplier_order' => $order->fresh(['supplier', 'items.drug'])]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Supplier order not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to approve supplier order.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function complete(Request $request, $id): JsonResponse
    {
        try {
            $order = SupplierOrder::with('items')->findOrFail($id);

            if ($order->status !== 'approved') {
                return response()->json(['message' => 'Only approved orders can be completed.'], 422);
            }

            $validated = $request->validate([
                'items' => 'required|array|min:1',
                'items.*.id' => 'required|integer',
                'items.*.buying_price' => 'required|numeric|min:0',
                'items.*.selling_price' => 'required|numeric|min:0',
                'items.*.quantity_received' => 'nullable|integer|min:0',
                'items.*.expiry_date' => 'nullable|date',
                'items.*.batch_number' => 'nullable|string',
            ]);

            $itemMap = $order->items->keyBy('id');
            $unknown = [];

            foreach ($validated['items'] as $row) {
                if (! isset($itemMap[$row['id']])) {
                    $unknown[] = $row['id'];
                }
            }

            if ($unknown) {
                return response()->json([
                    'message' => 'Items '.implode(', ', $unknown).' are not part of this order.',
                ], 422);
            }

            DB::beginTransaction();

            foreach ($validated['items'] as $row) {
                $item = $itemMap[$row['id']];
                $received = $row['quantity_received'] ?? $item->quantity_ordered;

                $drug = Drug::query()
                    ->whereKey($item->drug_id)
                    ->where('pharmacy_id', $order->pharmacy_id)
                    ->lockForUpdate()
                    ->first();

                if (! $drug) {
                    DB::rollBack();

                    return response()->json(['message' => 'Drug #'.$item->drug_id.' no longer exists.'], 422);
                }

                $drug->increment('quantity', $received);

                DrugMovement::create([
                    'pharmacy_id' => $order->pharmacy_id,
                    'drug_id' => $item->drug_id,
                    'movement_type' => 'purchase',
                    'quantity' => $received,
                    'unit_cost' => $row['buying_price'],
                    'reference_number' => $order->order_code,
                    'notes' => 'Supplier order auto stock-in: '.$order->order_code,
                    'performed_by' => Auth::id(),
                ]);

                $item->update([
                    'quantity_received' => $received,
                    'buying_price' => $row['buying_price'],
                    'selling_price' => $row['selling_price'],
                    'expiry_date' => $row['expiry_date'] ?? $item->expiry_date,
                    'batch_number' => $row['batch_number'] ?? $item->batch_number,
                ]);
            }

            $order->update([
                'status' => 'completed',
                'completed_by' => Auth::id(),
                'completed_at' => now(),
            ]);

            $order->supplier->updateOrderStats();

            CacheKey::bump('drugs', 'drugs:'.$order->pharmacy_id);

            DB::commit();

            return response()->json([
                'message' => 'Order completed - stock updated automatically.',
                'supplier_order' => $order->fresh(['supplier', 'items.drug', 'completedBy']),
            ]);
        } catch (ModelNotFoundException) {
            DB::rollBack();

            return response()->json(['message' => 'Supplier order not found.'], 404);
        } catch (ValidationException $e) {
            DB::rollBack();

            return response()->json(['message' => 'Validation failed.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Failed to complete supplier order.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    public function cancel($id): JsonResponse
    {
        try {
            $order = SupplierOrder::findOrFail($id);

            if (! $order->cancel()) {
                return response()->json(['message' => 'This order cannot be cancelled.'], 422);
            }

            return response()->json(['message' => 'Supplier order cancelled.', 'supplier_order' => $order]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Supplier order not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to cancel supplier order.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }
}
