<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ManufacturerOrder;
use App\Models\ManufacturerProduct;
use App\Models\User;
use App\Models\WholesaleInventory;
use App\Models\WholesaleOrder;
use App\Services\SupplyChainService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WholesalerPortalController extends Controller
{
    private const FLOW = ['pending', 'confirmed', 'packed', 'dispatched', 'delivered'];

    public function __construct(private SupplyChainService $supplyChain) {}

    private function wholesaler(Request $request): \App\Models\Wholesaler
    {
        $user = $request->user();
        if (! $user->isWholesaler()) {
            abort(403, 'Only wholesaler accounts can access this portal.');
        }
        $w = $user->wholesaler;
        if (! $w) {
            abort(403, 'This account is not linked to a wholesaler record.');
        }
        return $w;
    }

    public function overview(Request $request): JsonResponse
    {
        $w = $this->wholesaler($request);

        $orders = WholesaleOrder::where('wholesaler_id', $w->wholesaler_id);
        $lowStock = $w->inventory()->whereIn('status', ['low_stock', 'out_of_stock'])->count();
        $totalStock = (int) $w->inventory()->sum('quantity_in_stock');
        $mfgOrders = ManufacturerOrder::where('wholesaler_id', $w->wholesaler_id);

        $monthly = WholesaleOrder::where('wholesaler_id', $w->wholesaler_id)
            ->where('ordered_at', '>=', now()->subMonths(5)->startOfMonth())
            ->selectRaw("DATE_FORMAT(ordered_at, '%Y-%m') as month, COUNT(*) as orders, COALESCE(SUM(total_amount),0) as value")
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $recent = WholesaleOrder::with(['pharmacy'])
            ->where('wholesaler_id', $w->wholesaler_id)
            ->orderByDesc('ordered_at')
            ->limit(6)
            ->get();

        return response()->json([
            'wholesaler' => [
                'id' => $w->id,
                'wholesaler_id' => $w->wholesaler_id,
                'name' => $w->name,
                'status' => $w->status,
                'rating' => (float) $w->rating,
            ],
            'stats' => [
                'pharmacy_orders_total' => (clone $orders)->count(),
                'pharmacy_orders_active' => (clone $orders)->whereIn('status', ['pending', 'confirmed', 'packed', 'dispatched'])->count(),
                'pharmacy_orders_delivered' => (clone $orders)->where('status', 'delivered')->count(),
                'pharmacy_order_value' => (float) (clone $orders)->where('status', '!=', 'cancelled')->sum('total_amount'),
                'manufacturer_orders_total' => $mfgOrders->count(),
                'manufacturer_orders_active' => (clone $mfgOrders)->whereIn('status', ['pending', 'confirmed', 'packed', 'dispatched'])->count(),
                'inventory_items' => $w->inventory()->count(),
                'low_stock_items' => $lowStock,
                'total_stock' => $totalStock,
            ],
            'monthly' => $monthly,
            'recent_orders' => $recent->map(fn ($o) => $this->orderPayload($o)),
        ]);
    }

    public function orders(Request $request): JsonResponse
    {
        $w = $this->wholesaler($request);
        $query = WholesaleOrder::where('wholesaler_id', $w->wholesaler_id);

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('order_id', 'like', "%{$search}%")
                    ->orWhere('tracking_number', 'like', "%{$search}%")
                    ->orWhereHas('pharmacy', fn ($p) => $p->where('pharmacy_name', 'like', "%{$search}%"));
            });
        }

        $statsQuery = clone $query;
        $stats = [
            'total' => (clone $statsQuery)->count(),
            'active' => (clone $statsQuery)->whereIn('status', ['pending', 'confirmed', 'packed', 'dispatched'])->count(),
            'delivered' => (clone $statsQuery)->where('status', 'delivered')->count(),
            'total_value' => (float) (clone $statsQuery)->where('status', '!=', 'cancelled')->sum('total_amount'),
        ];

        $orders = $query->with(['lineItems', 'pharmacy', 'events'])
            ->orderByDesc('ordered_at')
            ->paginate((int) $request->input('per_page', 20));

        return response()->json([
            'data' => collect($orders->items())->map(fn ($o) => $this->orderPayload($o)),
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
        $w = $this->wholesaler($request);
        $order = WholesaleOrder::with(['lineItems', 'pharmacy', 'events', 'payments'])
            ->findOrFail($id);
        if ($order->wholesaler_id !== $w->wholesaler_id) {
            abort(403, 'You cannot view this order.');
        }
        return response()->json(['order' => $this->orderPayload($order)]);
    }

    public function updateOrderStatus(Request $request, $id): JsonResponse
    {
        $w = $this->wholesaler($request);
        $order = WholesaleOrder::with('lineItems')->findOrFail($id);
        if ($order->wholesaler_id !== $w->wholesaler_id) {
            abort(403, 'You cannot update this order.');
        }

        $validated = $request->validate([
            'status' => 'required|in:confirmed,packed,dispatched,delivered,cancelled',
            'notes' => 'nullable|string|max:2000',
            'tracking_number' => 'nullable|string|max:120',
            'delivery_partner' => 'nullable|string|max:120',
            'cancellation_reason' => 'nullable|string|max:1000',
        ]);

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
            return response()->json(['message' => "An order that is {$order->status} cannot move to {$target}."], 422);
        }

        DB::transaction(function () use ($order, $target, $validated, $request, $w) {
            $updates = ['status' => $target];

            match ($target) {
                'confirmed' => $updates += ['confirmed_at' => now(), 'prepared_at' => now()],
                'packed' => $updates += ['packed_at' => now()],
                'dispatched' => $updates += [
                    'dispatched_at' => now(),
                    'delivery_partner' => $validated['delivery_partner'] ?? 'Wholesaler delivery',
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
                $this->restoreWholesaleStock($order);
                $order->payments()->latest()->first()?->update(['status' => 'failed']);
            }

            if ($target === 'delivered') {
                $updates['delivered_at'] = now();
                if ($order->payment_method === 'cash') {
                    $updates['payment_status'] = 'paid';
                }
            }

            $order->update($updates);

            $messages = [
                'confirmed' => ['Order confirmed', 'Supplier confirmed the order and started preparing it.'],
                'packed' => ['Order prepared', 'All items are packed and ready for dispatch.'],
                'dispatched' => ['Order on the way', 'The order has left the supplier.'],
                'delivered' => ['Order delivered', 'The order reached the pharmacy.'],
                'cancelled' => ['Order cancelled', $updates['cancellation_reason'] ?? 'Cancelled by supplier'],
            ];

            if ($target === 'delivered') {
                $this->supplyChain->receiveWholesaleOrder($order);
                \App\Models\WholesaleOrderEvent::create([
                    'wholesale_order_id' => $order->id,
                    'status' => 'delivered',
                    'title' => 'Order delivered',
                    'description' => 'The order reached the pharmacy.',
                    'actor_id' => $request->user()->id,
                    'actor_name' => $request->user()->name,
                ]);
                if ($order->payment_method === 'cash') {
                    $order->payments()->latest()->first()?->update([
                        'status' => 'completed',
                        'payment_date' => now(),
                    ]);
                }
            } else {
                \App\Models\WholesaleOrderEvent::create([
                    'wholesale_order_id' => $order->id,
                    'status' => $target,
                    'title' => $messages[$target][0],
                    'description' => $messages[$target][1],
                    'actor_id' => $request->user()->id,
                    'actor_name' => $request->user()->name,
                ]);
            }
        });

        return response()->json([
            'message' => 'Order updated.',
            'order' => $this->orderPayload($order->fresh()->load(['lineItems', 'pharmacy', 'events', 'payments'])),
        ]);
    }

    public function inventory(Request $request): JsonResponse
    {
        $w = $this->wholesaler($request);
        $items = $w->inventory()->orderBy('drug_name')->get();
        return response()->json(['items' => $items->map(fn ($i) => $this->inventoryPayload($i))]);
    }

    public function storeInventory(Request $request): JsonResponse
    {
        $w = $this->wholesaler($request);
        $validated = $this->validateInventory($request);
        $item = WholesaleInventory::create($validated + [
            'wholesaler_id' => $w->wholesaler_id,
            'status' => $validated['status'] ?? $this->stockStatus($validated['quantity_in_stock']),
        ]);
        return response()->json(['message' => 'Inventory item added.', 'item' => $this->inventoryPayload($item)], 201);
    }

    public function updateInventory(Request $request, $id): JsonResponse
    {
        $w = $this->wholesaler($request);
        $item = WholesaleInventory::findOrFail($id);
        if ($item->wholesaler_id !== $w->wholesaler_id) {
            abort(403, 'You cannot modify this inventory item.');
        }
        $validated = $this->validateInventory($request);
        $item->update($validated + [
            'status' => $validated['status'] ?? $this->stockStatus($validated['quantity_in_stock']),
        ]);
        return response()->json(['message' => 'Inventory item updated.', 'item' => $this->inventoryPayload($item->fresh())]);
    }

    public function destroyInventory($id, Request $request): JsonResponse
    {
        $w = $this->wholesaler($request);
        $item = WholesaleInventory::findOrFail($id);
        if ($item->wholesaler_id !== $w->wholesaler_id) {
            abort(403, 'You cannot remove this inventory item.');
        }
        $item->delete();
        return response()->json(['message' => 'Inventory item removed.']);
    }

    public function manufacturers(Request $request): JsonResponse
    {
        $manufacturers = User::where('role', 'manufacturer')
            ->where('is_active', true)
            ->withCount('manufacturerProducts')
            ->get()
            ->map(fn (User $m) => [
                'id' => $m->id,
                'name' => $m->manufacturer_name ?: $m->name,
                'license' => $m->manufacturer_license,
                'address' => $m->manufacturer_address,
                'phone' => $m->manufacturer_phone,
                'email' => $m->manufacturer_email,
                'product_count' => (int) $m->manufacturer_products_count,
            ]);
        return response()->json(['data' => $manufacturers]);
    }

    public function manufacturerCatalog(Request $request, $id): JsonResponse
    {
        $manufacturer = User::where('role', 'manufacturer')
            ->where('is_active', true)
            ->findOrFail($id);

        $products = ManufacturerProduct::where('user_id', $manufacturer->id)
            ->where('status', 'active')
            ->where('quantity', '>', 0)
            ->orderBy('name')
            ->get();

        return response()->json([
            'manufacturer' => [
                'id' => $manufacturer->id,
                'name' => $manufacturer->manufacturer_name ?: $manufacturer->name,
            ],
            'items' => $products->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'generic_name' => $p->generic_name,
                'category' => $p->category,
                'strength' => $p->strength,
                'dosage_form' => $p->dosage_form,
                'sku' => $p->sku,
                'batch_number' => $p->batch_number,
                'quantity' => (int) $p->quantity,
                'wholesale_price' => (float) $p->wholesale_price,
                'expiry_date' => $p->expiry_date?->toDateString(),
            ]),
        ]);
    }

    public function manufacturerOrders(Request $request): JsonResponse
    {
        $w = $this->wholesaler($request);
        $query = ManufacturerOrder::where('wholesaler_id', $w->wholesaler_id);

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        $orders = $query->with(['lineItems', 'manufacturer', 'events'])
            ->orderByDesc('created_at')
            ->paginate((int) $request->input('per_page', 20));

        return response()->json([
            'data' => collect($orders->items())->map(fn ($o) => $this->mfgOrderPayload($o)),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function showManufacturerOrder(Request $request, $id): JsonResponse
    {
        $w = $this->wholesaler($request);
        $order = ManufacturerOrder::with(['lineItems', 'manufacturer', 'events'])->findOrFail($id);
        if ($order->wholesaler_id !== $w->wholesaler_id) {
            abort(403, 'You cannot view this order.');
        }
        return response()->json(['order' => $this->mfgOrderPayload($order)]);
    }

    public function storeManufacturerOrder(Request $request): JsonResponse
    {
        $w = $this->wholesaler($request);
        $controller = app(\App\Http\Controllers\Api\ManufacturerOrderController::class);
        // Delegate by faking the request user context? Instead call controller logic directly is complex.
        // Re-implement using the same flow as ManufacturerOrderController::store but with our wholesaler.
        $validated = $request->validate([
            'manufacturer_user_id' => 'required|exists:users,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:manufacturer_products,id',
            'items.*.quantity' => 'required|integer|min:1|max:100000',
            'payment_method' => 'nullable|in:cash,credit',
            'delivery_address' => 'nullable|string|max:500',
            'expected_delivery_date' => 'nullable|date',
            'notes' => 'nullable|string|max:2000',
        ]);

        $manufacturer = User::where('role', 'manufacturer')
            ->where('is_active', true)
            ->findOrFail($validated['manufacturer_user_id']);

        $order = DB::transaction(function () use ($validated, $request, $w, $manufacturer) {
            $subtotal = 0;
            $lines = [];

            foreach ($validated['items'] as $index => $line) {
                $product = ManufacturerProduct::where('user_id', $manufacturer->id)
                    ->lockForUpdate()
                    ->findOrFail($line['product_id']);

                if ((int) $product->quantity < (int) $line['quantity']) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        "items.{$index}.quantity" => "Only {$product->quantity} units of {$product->name} are available.",
                    ]);
                }

                $unitPrice = (float) $product->wholesale_price ?: (float) $product->selling_price;
                $lineTotal = round($unitPrice * (int) $line['quantity'], 2);
                $subtotal += $lineTotal;

                $lines[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'batch_number' => $product->batch_number,
                    'quantity' => (int) $line['quantity'],
                    'unit_price' => $unitPrice,
                    'total_price' => $lineTotal,
                ];

                $product->decrement('quantity', (int) $line['quantity']);
            }

            $total = round($subtotal, 2);

            $order = ManufacturerOrder::create([
                'order_id' => 'MO-'.date('Ymd').'-'.strtoupper(Str::random(6)),
                'manufacturer_user_id' => $manufacturer->id,
                'wholesaler_id' => $w->wholesaler_id,
                'wholesaler_name' => $w->name,
                'status' => 'pending',
                'payment_method' => $validated['payment_method'] ?? 'credit',
                'payment_status' => ($validated['payment_method'] ?? 'credit') === 'credit' ? 'credit' : 'pending',
                'subtotal' => $subtotal,
                'shipping_fee' => 0,
                'total_amount' => $total,
                'delivery_address' => $validated['delivery_address'] ?? $w->address,
                'notes' => $validated['notes'] ?? null,
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? now()->addDays(5)->toDateString(),
            ]);

            foreach ($lines as $line) {
                \App\Models\ManufacturerOrderItem::create([
                    'manufacturer_order_id' => $order->id,
                    'manufacturer_product_id' => $line['product_id'],
                    'product_name' => $line['product_name'],
                    'sku' => $line['sku'],
                    'batch_number' => $line['batch_number'],
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'total_price' => $line['total_price'],
                ]);
            }

            \App\Models\ManufacturerOrderEvent::create([
                'manufacturer_order_id' => $order->id,
                'status' => 'pending',
                'title' => 'Order placed',
                'description' => 'Order sent to '.$manufacturer->manufacturer_name.' for confirmation.',
                'actor_id' => $request->user()->id,
                'actor_name' => $request->user()->name,
            ]);

            return $order;
        });

        return response()->json([
            'message' => 'Order placed successfully.',
            'order' => $this->mfgOrderPayload($order->fresh()->load(['lineItems', 'manufacturer', 'events'])),
        ], 201);
    }

    public function cancelManufacturerOrder(Request $request, $id): JsonResponse
    {
        $w = $this->wholesaler($request);
        $order = ManufacturerOrder::with('lineItems')->findOrFail($id);
        if ($order->wholesaler_id !== $w->wholesaler_id) {
            abort(403, 'You cannot cancel this order.');
        }
        if (! in_array($order->status, ['pending', 'confirmed'], true)) {
            return response()->json(['message' => 'This order can no longer be cancelled.'], 422);
        }

        DB::transaction(function () use ($order, $request) {
            $this->supplyChain->restoreManufacturerStock($order);
            $order->update([
                'status' => 'cancelled',
                'payment_status' => 'failed',
                'cancelled_at' => now(),
                'cancellation_reason' => $request->input('reason', 'Cancelled by buyer'),
            ]);
            \App\Models\ManufacturerOrderEvent::create([
                'manufacturer_order_id' => $order->id,
                'status' => 'cancelled',
                'title' => 'Order cancelled',
                'description' => $request->input('reason', 'Cancelled by buyer'),
                'actor_id' => $request->user()->id,
                'actor_name' => $request->user()->name,
            ]);
        });

        return response()->json(['message' => 'Order cancelled.', 'order' => $this->mfgOrderPayload($order->fresh()->load(['lineItems', 'manufacturer', 'events']))]);
    }

    public function receiveManufacturerOrder(Request $request, $id): JsonResponse
    {
        $w = $this->wholesaler($request);
        $order = ManufacturerOrder::findOrFail($id);
        if ($order->wholesaler_id !== $w->wholesaler_id) {
            abort(403, 'You cannot receive this order.');
        }
        if ($order->status !== 'dispatched') {
            return response()->json(['message' => 'Only dispatched orders can be received.'], 422);
        }

        DB::transaction(function () use ($order, $request) {
            $order->update([
                'status' => 'delivered',
                'delivered_at' => now(),
                'payment_status' => $order->payment_method === 'cash' ? 'paid' : $order->payment_status,
            ]);
            $this->supplyChain->receiveManufacturerOrder($order);
            \App\Models\ManufacturerOrderEvent::create([
                'manufacturer_order_id' => $order->id,
                'status' => 'delivered',
                'title' => 'Order delivered',
                'description' => 'Received by wholesaler.',
                'actor_id' => $request->user()->id,
                'actor_name' => $request->user()->name,
            ]);
        });

        return response()->json(['message' => 'Order received.', 'order' => $this->mfgOrderPayload($order->fresh()->load(['lineItems', 'manufacturer', 'events']))]);
    }

    public function profile(Request $request): JsonResponse
    {
        $w = $this->wholesaler($request);
        return response()->json(['data' => $w]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $w = $this->wholesaler($request);
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:30',
            'address' => 'sometimes|string',
            'city' => 'sometimes|string|max:120',
            'region' => 'sometimes|string|max:120',
            'contact_person' => 'sometimes|string|max:255',
            'contact_phone' => 'sometimes|string|max:30',
        ]);
        $w->update($validated);
        return response()->json(['message' => 'Profile updated.', 'data' => $w->fresh()]);
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

    private function stockStatus(int $quantity): string
    {
        if ($quantity <= 0) return 'out_of_stock';
        return $quantity <= 10 ? 'low_stock' : 'available';
    }

    private function restoreWholesaleStock(WholesaleOrder $order): void
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

    private function orderPayload(WholesaleOrder $order): array
    {
        $items = $order->relationLoaded('lineItems') ? $order->lineItems : $order->lineItems()->get();
        return [
            'id' => $order->id,
            'order_id' => $order->order_id,
            'pharmacy_id' => $order->pharmacy_id,
            'pharmacy_name' => $order->pharmacy?->pharmacy_name,
            'wholesaler_id' => $order->wholesaler_id,
            'wholesaler_name' => $order->wholesaler?->name,
            'status' => $order->status,
            'next_status' => $this->nextStatus($order->status),
            'payment_method' => $order->payment_method,
            'payment_status' => $order->payment_status,
            'shipment_method' => $order->shipment_method,
            'shipment_fee' => (float) $order->shipment_fee,
            'subtotal' => round((float) $items->sum('total_price'), 2),
            'total_amount' => (float) $order->total_amount,
            'delivery_address' => $order->delivery_address,
            'tracking_number' => $order->tracking_number,
            'delivery_partner' => $order->delivery_partner,
            'notes' => $order->notes,
            'ordered_at' => $order->ordered_at?->toIso8601String(),
            'expected_delivery_date' => $order->expected_delivery_date?->toDateString(),
            'confirmed_at' => $order->confirmed_at?->toIso8601String(),
            'packed_at' => $order->packed_at?->toIso8601String(),
            'dispatched_at' => $order->dispatched_at?->toIso8601String(),
            'delivered_at' => $order->delivered_at?->toIso8601String(),
            'cancelled_at' => $order->cancelled_at?->toIso8601String(),
            'cancellation_reason' => $order->cancellation_reason,
            'items' => $items->map(fn ($i) => [
                'id' => $i->id,
                'drug_id' => $i->drug_id,
                'drug_name' => $i->drug_name,
                'unit' => $i->unit ?: 'unit',
                'pack_size' => (int) ($i->pack_size ?: 1),
                'quantity' => (int) $i->quantity,
                'unit_price' => (float) $i->unit_price,
                'total_price' => (float) $i->total_price,
                'quantity_received' => (int) $i->quantity_received,
            ])->values(),
            'events' => $order->relationLoaded('events')
                ? $order->events->map(fn ($e) => [
                    'id' => $e->id,
                    'status' => $e->status,
                    'title' => $e->title,
                    'description' => $e->description,
                    'actor_name' => $e->actor_name,
                    'created_at' => $e->created_at?->toIso8601String(),
                ])->values()
                : [],
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

    private function mfgOrderPayload(ManufacturerOrder $order): array
    {
        $items = $order->relationLoaded('lineItems') ? $order->lineItems : $order->lineItems()->get();
        return [
            'id' => $order->id,
            'order_id' => $order->order_id,
            'manufacturer_user_id' => $order->manufacturer_user_id,
            'manufacturer_name' => $order->manufacturer?->manufacturer_name ?: $order->manufacturer?->name,
            'wholesaler_id' => $order->wholesaler_id,
            'wholesaler_name' => $order->wholesaler_name,
            'status' => $order->status,
            'next_status' => $this->nextStatus($order->status),
            'payment_method' => $order->payment_method,
            'payment_status' => $order->payment_status,
            'subtotal' => (float) $order->subtotal,
            'total_amount' => (float) $order->total_amount,
            'delivery_address' => $order->delivery_address,
            'notes' => $order->notes,
            'expected_delivery_date' => $order->expected_delivery_date?->toDateString(),
            'created_at' => $order->created_at?->toIso8601String(),
            'items' => $items->map(fn ($i) => [
                'id' => $i->id,
                'product_id' => $i->manufacturer_product_id,
                'product_name' => $i->product_name,
                'sku' => $i->sku,
                'batch_number' => $i->batch_number,
                'quantity' => (int) $i->quantity,
                'quantity_received' => (int) $i->quantity_received,
                'unit_price' => (float) $i->unit_price,
                'total_price' => (float) $i->total_price,
            ])->values(),
            'events' => $order->relationLoaded('events')
                ? $order->events->map(fn ($e) => [
                    'id' => $e->id,
                    'status' => $e->status,
                    'title' => $e->title,
                    'description' => $e->description,
                    'actor_name' => $e->actor_name,
                    'created_at' => $e->created_at?->toIso8601String(),
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
