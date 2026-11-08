<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WholesaleCreditTerms;
use App\Models\WholesaleInventory;
use App\Models\WholesaleOrder;
use App\Models\WholesaleOrderEvent;
use App\Models\WholesaleOrderItem;
use App\Models\WholesalePayment;
use App\Models\Wholesaler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Pharmacy-facing wholesale marketplace.
 *
 * A pharmacy browses active wholesalers/distributors, orders medicines by the
 * unit it actually needs (piece, pack, box, carton), chooses pickup or
 * delivery, and pays cash on delivery or on credit against its account number.
 * Admins use the same payloads to confirm, pack, dispatch and settle orders.
 */
class WholesaleMarketplaceController extends Controller
{
    private const FLOW = ['pending', 'confirmed', 'packed', 'dispatched', 'delivered'];

    public function wholesalers(Request $request): JsonResponse
    {
        $query = Wholesaler::query()
            ->where('status', 'active')
            ->withCount('inventory');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhere('region', 'like', "%{$search}%")
                    ->orWhere('business_type', 'like', "%{$search}%");
            });
        }

        if ($request->filled('business_type')) {
            $query->where('business_type', $request->input('business_type'));
        }

        $wholesalers = $query->orderByDesc('rating')->orderBy('name')->get()
            ->map(fn (Wholesaler $wholesaler) => $this->wholesalerPayload($wholesaler));

        return response()->json(['data' => $wholesalers]);
    }

    public function catalog($id): JsonResponse
    {
        $wholesaler = Wholesaler::query()
            ->where('status', 'active')
            ->with(['inventory' => fn ($query) => $query->orderBy('drug_name')->orderBy('unit')])
            ->findOrFail($id);

        $items = $wholesaler->inventory
            ->filter(fn (WholesaleInventory $item) => $item->status !== 'expired' && $item->quantity_in_stock > 0)
            ->values()
            ->map(fn (WholesaleInventory $item) => $this->inventoryPayload($item));

        return response()->json([
            'wholesaler' => $this->wholesalerPayload($wholesaler),
            'items' => $items,
            'categories' => $items->pluck('category')->filter()->unique()->values(),
        ]);
    }

    public function orders(Request $request): JsonResponse
    {
        $user = $request->user();
        $base = $this->scopedOrderQuery($request, $user);

        $statsQuery = clone $base;
        $stats = [
            'total' => (clone $statsQuery)->count(),
            'active' => (clone $statsQuery)->whereIn('status', ['pending', 'confirmed', 'packed', 'dispatched'])->count(),
            'delivered' => (clone $statsQuery)->where('status', 'delivered')->count(),
            'total_value' => (float) (clone $statsQuery)->where('status', '!=', 'cancelled')->sum('total_amount'),
        ];

        $query = clone $base;
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('order_id', 'like', "%{$search}%")
                    ->orWhere('tracking_number', 'like', "%{$search}%")
                    ->orWhereHas('wholesaler', fn ($w) => $w->where('name', 'like', "%{$search}%"));
            });
        }

        $orders = $query->with(['lineItems', 'wholesaler', 'pharmacy', 'events'])
            ->orderByDesc('ordered_at')
            ->paginate((int) $request->input('per_page', 20));

        return response()->json([
            'data' => collect($orders->items())->map(fn (WholesaleOrder $order) => $this->orderPayload($order)),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
            'stats' => $stats,
        ]);
    }

    public function showOrder(Request $request, $id): JsonResponse
    {
        $order = WholesaleOrder::with(['lineItems', 'wholesaler', 'pharmacy', 'events', 'payments'])
            ->findOrFail($id);

        $this->authorizePharmacy($request->user(), (string) $order->pharmacy_id);

        return response()->json(['order' => $this->orderPayload($order)]);
    }

    public function storeOrder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pharmacy_id' => 'required|exists:pharmacies,id',
            'wholesaler_id' => 'required|exists:wholesalers,id',
            'items' => 'required|array|min:1',
            'items.*.inventory_id' => 'required|exists:wholesale_inventory,id',
            'items.*.quantity' => 'required|integer|min:1|max:100000',
            'items.*.unit' => 'nullable|string|max:30',
            'shipment_method' => 'required|in:pickup,standard,express',
            'delivery_address' => 'required_unless:shipment_method,pickup|nullable|string|max:500',
            'payment_method' => 'required|in:cash,credit',
            'account_number' => 'required_if:payment_method,credit|nullable|string|max:120',
            'payment_reference' => 'nullable|string|max:120',
            'expected_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string|max:2000',
        ]);

        $user = $request->user();
        $this->authorizePharmacy($user, (string) $validated['pharmacy_id']);

        $order = DB::transaction(function () use ($validated, $request) {
            $wholesaler = Wholesaler::where('status', 'active')->findOrFail($validated['wholesaler_id']);
            $subtotal = 0;
            $lines = [];
            $inventoryRows = [];

            foreach ($validated['items'] as $index => $line) {
                /** @var WholesaleInventory $inventory */
                $inventory = WholesaleInventory::where('wholesaler_id', $wholesaler->wholesaler_id)
                    ->lockForUpdate()
                    ->findOrFail($line['inventory_id']);

                if (! empty($line['unit']) && $line['unit'] !== $inventory->unit) {
                    throw ValidationException::withMessages([
                        "items.{$index}.unit" => "{$inventory->drug_name} is sold by {$inventory->unit}, not {$line['unit']}.",
                    ]);
                }

                if ($inventory->status === 'expired') {
                    throw ValidationException::withMessages([
                        "items.{$index}.inventory_id" => "{$inventory->drug_name} has expired and cannot be ordered.",
                    ]);
                }

                if ($inventory->quantity_in_stock < $line['quantity']) {
                    throw ValidationException::withMessages([
                        "items.{$index}.quantity" => "Only {$inventory->quantity_in_stock} {$inventory->unit}(s) of {$inventory->drug_name} are available.",
                    ]);
                }

                $lineTotal = round((float) $inventory->unit_price * (int) $line['quantity'], 2);
                $subtotal += $lineTotal;

                $lines[] = [
                    'inventory_id' => $inventory->id,
                    'drug_id' => $inventory->drug_id,
                    'drug_name' => $inventory->drug_name,
                    'unit' => $inventory->unit,
                    'pack_size' => $inventory->pack_size,
                    'quantity' => (int) $line['quantity'],
                    'unit_price' => (float) $inventory->unit_price,
                    'total_price' => $lineTotal,
                ];
                $inventoryRows[] = [$inventory, (int) $line['quantity']];
            }

            $subtotal = round($subtotal, 2);

            if ((float) $wholesaler->minimum_order_amount > 0 && $subtotal < (float) $wholesaler->minimum_order_amount) {
                throw ValidationException::withMessages([
                    'items' => 'The minimum order for '.$wholesaler->name.' is '.number_format((float) $wholesaler->minimum_order_amount, 2).'.',
                ]);
            }

            $shipmentFee = match ($validated['shipment_method']) {
                'pickup' => 0,
                'express' => (float) ($wholesaler->express_delivery_fee ?: $wholesaler->delivery_fee),
                default => (float) $wholesaler->delivery_fee,
            };
            $total = round($subtotal + $shipmentFee, 2);

            if ($validated['payment_method'] === 'credit') {
                if (! $wholesaler->accepts_credit) {
                    throw ValidationException::withMessages([
                        'payment_method' => 'This supplier does not offer credit accounts. Choose cash instead.',
                    ]);
                }

                $terms = WholesaleCreditTerms::where('wholesaler_id', $wholesaler->wholesaler_id)
                    ->where('pharmacy_id', (string) $validated['pharmacy_id'])
                    ->first();

                if ($terms && $terms->status !== 'active') {
                    throw ValidationException::withMessages([
                        'payment_method' => 'Your credit account with this supplier is not active.',
                    ]);
                }

                $outstanding = (float) WholesaleOrder::where('wholesaler_id', $wholesaler->wholesaler_id)
                    ->where('pharmacy_id', (string) $validated['pharmacy_id'])
                    ->where('payment_method', 'credit')
                    ->where('payment_status', '!=', 'paid')
                    ->where('status', '!=', 'cancelled')
                    ->sum('total_amount');

                if ($terms && $outstanding + $total > (float) $terms->credit_limit) {
                    throw ValidationException::withMessages([
                        'payment_method' => 'This order would exceed your credit limit of '.number_format((float) $terms->credit_limit, 2).'.',
                    ]);
                }
            }

            foreach ($inventoryRows as [$inventory, $quantity]) {
                $inventory->decrement('quantity_in_stock', $quantity);
                $inventory->update([
                    'status' => $this->stockStatus($inventory->fresh()->quantity_in_stock),
                ]);
            }

            $expected = $validated['expected_delivery_date'] ?? match ($validated['shipment_method']) {
                'pickup' => now()->toDateString(),
                'express' => now()->addDay()->toDateString(),
                default => now()->addDays(3)->toDateString(),
            };

            $order = WholesaleOrder::create([
                'order_id' => $this->generateOrderId(),
                'pharmacy_id' => (string) $validated['pharmacy_id'],
                'wholesaler_id' => $wholesaler->wholesaler_id,
                'items' => $lines,
                'total_amount' => $total,
                'shipment_fee' => $shipmentFee,
                'shipment_method' => $validated['shipment_method'],
                'delivery_address' => $validated['delivery_address'] ?? '',
                'payment_method' => $validated['payment_method'],
                'payment_status' => $validated['payment_method'] === 'credit' ? 'credit' : 'pending',
                'account_number' => $validated['account_number'] ?? null,
                'payment_reference' => $validated['payment_reference'] ?? null,
                'status' => 'pending',
                'ordered_at' => now(),
                'expected_delivery_date' => $expected,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($lines as $line) {
                WholesaleOrderItem::create([
                    'wholesale_order_id' => $order->id,
                    'inventory_id' => $line['inventory_id'],
                    'drug_id' => $line['drug_id'],
                    'drug_name' => $line['drug_name'],
                    'unit' => $line['unit'],
                    'pack_size' => $line['pack_size'],
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'total_price' => $line['total_price'],
                ]);
            }

            WholesalePayment::create([
                'wholesale_order_id' => $order->id,
                'amount' => $total,
                'payment_method' => $validated['payment_method'],
                'status' => 'pending',
                'transaction_reference' => $validated['payment_reference'] ?? null,
                'notes' => $validated['payment_method'] === 'credit'
                    ? 'Credit order against account '.$validated['account_number']
                    : 'Cash payable on delivery',
            ]);

            $this->addEvent($order, 'pending', 'Order placed', 'Order sent to '.$wholesaler->name.' for confirmation.', $request->user());
            $wholesaler->increment('total_orders');

            return $order->fresh();
        });

        return response()->json([
            'message' => 'Order placed successfully.',
            'order' => $this->orderPayload($order->load(['lineItems', 'wholesaler', 'pharmacy', 'events', 'payments'])),
        ], 201);
    }

    public function cancelOrder(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        $order = WholesaleOrder::with('lineItems')->findOrFail($id);
        $this->authorizePharmacy($request->user(), (string) $order->pharmacy_id);

        if (! in_array($order->status, ['pending', 'confirmed'], true)) {
            return response()->json(['message' => 'This order can no longer be cancelled.'], 422);
        }

        DB::transaction(function () use ($order, $validated, $request) {
            $this->restoreStock($order);
            $order->update([
                'status' => 'cancelled',
                'payment_status' => 'failed',
                'cancelled_at' => now(),
                'cancellation_reason' => $validated['reason'] ?? 'Cancelled by pharmacy',
            ]);
            $order->payments()->latest()->first()?->update(['status' => 'failed']);
            $this->addEvent($order, 'cancelled', 'Order cancelled', $validated['reason'] ?? 'Cancelled by pharmacy', $request->user());
        });

        return response()->json(['message' => 'Order cancelled.', 'order' => $this->orderPayload($order->fresh()->load(['lineItems', 'wholesaler', 'pharmacy', 'events', 'payments']))]);
    }

    public function receiveOrder(Request $request, $id): JsonResponse
    {
        $order = WholesaleOrder::findOrFail($id);
        $this->authorizePharmacy($request->user(), (string) $order->pharmacy_id);

        if ($order->status !== 'dispatched') {
            return response()->json(['message' => 'Only dispatched orders can be received.'], 422);
        }

        DB::transaction(function () use ($order, $request) {
            $this->markDelivered($order, $request->user(), 'Received by pharmacy');
        });

        return response()->json(['message' => 'Order received.', 'order' => $this->orderPayload($order->fresh()->load(['lineItems', 'wholesaler', 'pharmacy', 'events', 'payments']))]);
    }

    public function adminOrders(Request $request): JsonResponse
    {
        return $this->orders($request);
    }

    public function adminShowOrder(Request $request, $id): JsonResponse
    {
        $order = WholesaleOrder::with(['lineItems', 'wholesaler', 'pharmacy', 'events', 'payments'])
            ->findOrFail($id);

        return response()->json(['order' => $this->orderPayload($order)]);
    }

    public function adminUpdateStatus(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:confirmed,packed,dispatched,delivered,cancelled',
            'notes' => 'nullable|string|max:2000',
            'tracking_number' => 'nullable|string|max:120',
            'delivery_partner' => 'nullable|string|max:120',
            'cancellation_reason' => 'nullable|string|max:1000',
        ]);

        $order = WholesaleOrder::with('lineItems')->findOrFail($id);
        $target = $validated['status'];
        $allowed = [
            'pending' => ['confirmed', 'cancelled'],
            'confirmed' => ['packed', 'cancelled'],
            'packed' => ['dispatched', 'cancelled'],
            'dispatched' => ['delivered'],
            'delivered' => [],
            'cancelled' => [],
        ];

        if (! in_array($target, $allowed[$order->status] ?? [], true)) {
            return response()->json([
                'message' => "An order that is {$order->status} cannot move to {$target}.",
            ], 422);
        }

        DB::transaction(function () use ($order, $target, $validated, $request) {
            $updates = ['status' => $target];

            match ($target) {
                'confirmed' => $updates += ['confirmed_at' => now(), 'prepared_at' => now()],
                'packed' => $updates += ['packed_at' => now()],
                'dispatched' => $updates += [
                    'dispatched_at' => now(),
                    'delivery_partner' => $validated['delivery_partner'] ?? 'Supplier delivery',
                    'tracking_number' => $validated['tracking_number'] ?? null,
                ],
                'cancelled' => $updates += [
                    'cancelled_at' => now(),
                    'cancellation_reason' => $validated['cancellation_reason'] ?? $validated['notes'] ?? 'Cancelled by supplier',
                    'payment_status' => 'failed',
                ],
                default => null,
            };

            if ($validated['notes'] ?? null) {
                $updates['notes'] = $validated['notes'];
            }

            if ($target === 'cancelled') {
                $this->restoreStock($order);
                $order->payments()->latest()->first()?->update(['status' => 'failed']);
            }

            $order->update($updates);

            $messages = [
                'confirmed' => ['Order confirmed', 'Supplier confirmed the order and started preparing it.'],
                'packed' => ['Order prepared', 'All items are packed and ready for dispatch.'],
                'dispatched' => ['Order on the way', 'The order has left the supplier and is coming to your pharmacy.'],
                'delivered' => ['Order delivered', 'The order reached the pharmacy.'],
                'cancelled' => ['Order cancelled', $updates['cancellation_reason'] ?? 'Cancelled by supplier'],
            ];

            if ($target === 'delivered') {
                $this->markDelivered($order, $request->user(), 'Delivered by supplier');
            } elseif ($target === 'cancelled') {
                $this->addEvent($order, 'cancelled', $messages['cancelled'][0], $messages['cancelled'][1], $request->user());
            } else {
                $this->addEvent($order, $target, $messages[$target][0], $messages[$target][1], $request->user());
            }
        });

        return response()->json([
            'message' => 'Order updated.',
            'order' => $this->orderPayload($order->fresh()->load(['lineItems', 'wholesaler', 'pharmacy', 'events', 'payments'])),
        ]);
    }

    public function adminMarkPaid(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'payment_reference' => 'nullable|string|max:120',
            'notes' => 'nullable|string|max:1000',
        ]);

        $order = WholesaleOrder::findOrFail($id);

        DB::transaction(function () use ($order, $validated, $request) {
            $order->update([
                'payment_status' => 'paid',
                'payment_reference' => $validated['payment_reference'] ?? $order->payment_reference,
            ]);

            $payment = $order->payments()->latest()->first();
            if ($payment) {
                $payment->update([
                    'status' => 'completed',
                    'payment_date' => now(),
                    'transaction_reference' => $validated['payment_reference'] ?? $payment->transaction_reference,
                    'notes' => $validated['notes'] ?? $payment->notes,
                ]);
            } else {
                $order->payments()->create([
                    'amount' => $order->total_amount,
                    'payment_method' => $order->payment_method,
                    'status' => 'completed',
                    'transaction_reference' => $validated['payment_reference'] ?? null,
                    'payment_date' => now(),
                    'notes' => $validated['notes'] ?? null,
                ]);
            }

            $this->addEvent($order, 'payment', 'Payment confirmed', 'Payment of '.number_format((float) $order->total_amount, 2).' recorded.', $request->user());
        });

        return response()->json([
            'message' => 'Payment recorded.',
            'order' => $this->orderPayload($order->fresh()->load(['lineItems', 'wholesaler', 'pharmacy', 'events', 'payments'])),
        ]);
    }

    public function adminInventory($wholesalerId): JsonResponse
    {
        $wholesaler = Wholesaler::findOrFail($wholesalerId);
        $items = $wholesaler->inventory()->orderBy('drug_name')->get()
            ->map(fn (WholesaleInventory $item) => $this->inventoryPayload($item));

        return response()->json([
            'wholesaler' => $this->wholesalerPayload($wholesaler),
            'items' => $items,
        ]);
    }

    public function adminStoreInventory(Request $request, $wholesalerId): JsonResponse
    {
        $wholesaler = Wholesaler::findOrFail($wholesalerId);
        $validated = $this->validateInventory($request);

        $item = WholesaleInventory::create($validated + [
            'wholesaler_id' => $wholesaler->wholesaler_id,
            'status' => $validated['status'] ?? $this->stockStatus($validated['quantity_in_stock']),
        ]);

        return response()->json(['message' => 'Inventory item added.', 'item' => $this->inventoryPayload($item)], 201);
    }

    public function adminUpdateInventory(Request $request, $id): JsonResponse
    {
        $item = WholesaleInventory::findOrFail($id);
        $validated = $this->validateInventory($request);

        $item->update($validated + [
            'status' => $validated['status'] ?? $this->stockStatus($validated['quantity_in_stock']),
        ]);

        return response()->json(['message' => 'Inventory item updated.', 'item' => $this->inventoryPayload($item->fresh())]);
    }

    public function adminDestroyInventory($id): JsonResponse
    {
        $item = WholesaleInventory::findOrFail($id);
        $item->delete();

        return response()->json(['message' => 'Inventory item removed.']);
    }

    private function validateInventory(Request $request): array
    {
        return $request->validate([
            'drug_name' => 'required|string|max:255',
            'unit' => 'required|string|max:30',
            'pack_size' => 'nullable|integer|min:1|max:100000',
            'category' => 'nullable|string|max:120',
            'batch_number' => 'required|string|max:120',
            'quantity_in_stock' => 'required|integer|min:0',
            'minimum_stock_level' => 'nullable|integer|min:0',
            'reorder_quantity' => 'nullable|integer|min:0',
            'unit_price' => 'required|numeric|min:0',
            'expiry_date' => 'required|date',
            'manufacture_date' => 'nullable|date',
            'location' => 'nullable|string|max:120',
            'status' => 'nullable|in:available,low_stock,out_of_stock,expired',
        ]);
    }

    private function scopedOrderQuery(Request $request, $user)
    {
        $query = WholesaleOrder::query();

        if (! $user->isAdmin()) {
            $ids = array_map('strval', $user->accessiblePharmacyIds());

            if ($request->filled('pharmacy_id')) {
                $requested = (string) $request->input('pharmacy_id');
                if (! in_array($requested, $ids, true)) {
                    abort(403, 'You cannot view orders for this pharmacy.');
                }
                $query->where('pharmacy_id', $requested);
            } else {
                $query->whereIn('pharmacy_id', $ids);
            }
        } elseif ($request->filled('pharmacy_id')) {
            $query->where('pharmacy_id', (string) $request->input('pharmacy_id'));
        }

        if ($request->filled('wholesaler_id')) {
            $query->where('wholesaler_id', $request->input('wholesaler_id'));
        }

        return $query;
    }

    private function authorizePharmacy($user, string $pharmacyId): void
    {
        if ($user->isAdmin()) {
            return;
        }

        $ids = array_map('strval', $user->accessiblePharmacyIds());
        if (! in_array($pharmacyId, $ids, true)) {
            abort(403, 'You cannot manage orders for this pharmacy.');
        }
    }

    private function markDelivered(WholesaleOrder $order, $actor, string $description): void
    {
        $updates = [
            'status' => 'delivered',
            'delivered_at' => now(),
        ];

        $payment = null;
        if ($order->payment_method === 'cash' && $order->payment_status !== 'paid') {
            $updates['payment_status'] = 'paid';
            $payment = $order->payments()->latest()->first();
        }

        $order->update($updates);

        if ($payment) {
            $payment->update([
                'status' => 'completed',
                'payment_date' => now(),
                'notes' => 'Cash collected on delivery',
            ]);
        }

        $this->addEvent($order, 'delivered', 'Order delivered', $description, $actor);
    }

    private function restoreStock(WholesaleOrder $order): void
    {
        foreach ($order->lineItems as $item) {
            $inventory = $item->inventory_id
                ? WholesaleInventory::find($item->inventory_id)
                : WholesaleInventory::where('wholesaler_id', $order->wholesaler_id)
                    ->where('drug_id', $item->drug_id)
                    ->where('unit', $item->unit)
                    ->first();

            if ($inventory) {
                $inventory->increment('quantity_in_stock', $item->quantity);
                $inventory->update(['status' => $this->stockStatus($inventory->fresh()->quantity_in_stock)]);
            }
        }
    }

    private function addEvent(WholesaleOrder $order, string $status, string $title, ?string $description, $actor): void
    {
        WholesaleOrderEvent::create([
            'wholesale_order_id' => $order->id,
            'status' => $status,
            'title' => $title,
            'description' => $description,
            'actor_id' => $actor?->id,
            'actor_name' => $actor?->name,
        ]);
    }

    private function stockStatus(int $quantity): string
    {
        if ($quantity <= 0) {
            return 'out_of_stock';
        }

        return $quantity <= 10 ? 'low_stock' : 'available';
    }

    private function generateOrderId(): string
    {
        do {
            $id = 'WO-'.date('Ymd').'-'.strtoupper(Str::random(6));
        } while (WholesaleOrder::where('order_id', $id)->exists());

        return $id;
    }

    private function wholesalerPayload(Wholesaler $wholesaler): array
    {
        return [
            'id' => $wholesaler->id,
            'wholesaler_id' => $wholesaler->wholesaler_id,
            'name' => $wholesaler->name,
            'business_type' => $wholesaler->business_type ?: 'wholesaler',
            'email' => $wholesaler->email,
            'phone' => $wholesaler->phone,
            'address' => $wholesaler->address,
            'city' => $wholesaler->city,
            'region' => $wholesaler->region,
            'country' => $wholesaler->country,
            'license_number' => $wholesaler->license_number,
            'bank_name' => $wholesaler->bank_name,
            'bank_account' => $wholesaler->bank_account,
            'status' => $wholesaler->status,
            'rating' => (float) $wholesaler->rating,
            'on_time_delivery_rate' => (float) $wholesaler->on_time_delivery_rate,
            'delivery_fee' => (float) $wholesaler->delivery_fee,
            'express_delivery_fee' => (float) $wholesaler->express_delivery_fee,
            'minimum_order_amount' => (float) $wholesaler->minimum_order_amount,
            'payment_terms_days' => (int) $wholesaler->payment_terms_days,
            'accepts_credit' => (bool) $wholesaler->accepts_credit,
            'inventory_count' => (int) ($wholesaler->inventory_count ?? $wholesaler->inventory()->count()),
        ];
    }

    private function inventoryPayload(WholesaleInventory $item): array
    {
        return [
            'id' => $item->id,
            'wholesaler_id' => $item->wholesaler_id,
            'drug_id' => $item->drug_id,
            'drug_name' => $item->drug_name,
            'unit' => $item->unit ?: 'unit',
            'pack_size' => (int) ($item->pack_size ?: 1),
            'category' => $item->category,
            'batch_number' => $item->batch_number,
            'quantity_in_stock' => (int) $item->quantity_in_stock,
            'minimum_stock_level' => (int) $item->minimum_stock_level,
            'reorder_quantity' => (int) $item->reorder_quantity,
            'unit_price' => (float) $item->unit_price,
            'expiry_date' => $item->expiry_date?->toDateString(),
            'manufacture_date' => $item->manufacture_date?->toDateString(),
            'location' => $item->location,
            'status' => $item->status,
        ];
    }

    private function orderPayload(WholesaleOrder $order): array
    {
        $items = $order->relationLoaded('lineItems')
            ? $order->lineItems
            : $order->lineItems()->get();

        return [
            'id' => $order->id,
            'order_id' => $order->order_id,
            'pharmacy_id' => $order->pharmacy_id,
            'pharmacy_name' => $order->pharmacy?->pharmacy_name,
            'wholesaler_id' => $order->wholesaler_id,
            'wholesaler_name' => $order->wholesaler?->name,
            'wholesaler_phone' => $order->wholesaler?->phone,
            'wholesaler_address' => $order->wholesaler?->address,
            'status' => $order->status,
            'next_status' => $this->nextStatus($order->status),
            'payment_method' => $order->payment_method,
            'payment_status' => $order->payment_status,
            'shipment_method' => $order->shipment_method,
            'shipment_fee' => (float) $order->shipment_fee,
            'subtotal' => round((float) $items->sum('total_price'), 2),
            'total_amount' => (float) $order->total_amount,
            'delivery_address' => $order->delivery_address,
            'account_number' => $order->account_number,
            'payment_reference' => $order->payment_reference,
            'tracking_number' => $order->tracking_number,
            'delivery_partner' => $order->delivery_partner,
            'notes' => $order->notes,
            'ordered_at' => $order->ordered_at?->toIso8601String(),
            'expected_delivery_date' => $order->expected_delivery_date?->toDateString(),
            'confirmed_at' => $order->confirmed_at?->toIso8601String(),
            'prepared_at' => $order->prepared_at?->toIso8601String(),
            'packed_at' => $order->packed_at?->toIso8601String(),
            'dispatched_at' => $order->dispatched_at?->toIso8601String(),
            'delivered_at' => $order->delivered_at?->toIso8601String(),
            'cancelled_at' => $order->cancelled_at?->toIso8601String(),
            'cancellation_reason' => $order->cancellation_reason,
            'items' => $items->map(fn (WholesaleOrderItem $item) => [
                'id' => $item->id,
                'drug_id' => $item->drug_id,
                'drug_name' => $item->drug_name,
                'unit' => $item->unit ?: 'unit',
                'pack_size' => (int) ($item->pack_size ?: 1),
                'quantity' => (int) $item->quantity,
                'unit_price' => (float) $item->unit_price,
                'total_price' => (float) $item->total_price,
                'quantity_received' => (int) $item->quantity_received,
            ])->values(),
            'events' => $order->relationLoaded('events')
                ? $order->events->map(fn (WholesaleOrderEvent $event) => [
                    'id' => $event->id,
                    'status' => $event->status,
                    'title' => $event->title,
                    'description' => $event->description,
                    'actor_name' => $event->actor_name,
                    'created_at' => $event->created_at?->toIso8601String(),
                ])->values()
                : [],
            'payments' => $order->relationLoaded('payments')
                ? $order->payments->map(fn (WholesalePayment $payment) => [
                    'id' => $payment->id,
                    'amount' => (float) $payment->amount,
                    'payment_method' => $payment->payment_method,
                    'status' => $payment->status,
                    'transaction_reference' => $payment->transaction_reference,
                    'payment_date' => $payment->payment_date?->toIso8601String(),
                ])->values()
                : [],
        ];
    }

    private function nextStatus(string $status): ?string
    {
        $index = array_search($status, self::FLOW, true);

        return $index === false ? null : (self::FLOW[$index + 1] ?? null);
    }
}
