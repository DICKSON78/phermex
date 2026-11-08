<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ManufacturerOrder;
use App\Models\ManufacturerOrderEvent;
use App\Models\ManufacturerOrderItem;
use App\Models\ManufacturerProduct;
use App\Models\User;
use App\Services\SupplyChainService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Manufacturer ↔ wholesaler purchase orders. Mirrors the wholesale marketplace
 * order flow (pending → confirmed → packed → dispatched → delivered) but
 * scoped to a single manufacturer's catalogue and a single wholesaler buyer.
 */
class ManufacturerOrderController extends Controller
{
    private const FLOW = ['pending', 'confirmed', 'packed', 'dispatched', 'delivered'];

    public function __construct(private SupplyChainService $supplyChain) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = ManufacturerOrder::with(['lineItems', 'manufacturer', 'events']);

        if (! $user->isAdmin()) {
            $query->where('manufacturer_user_id', $user->id);
        } elseif ($request->filled('manufacturer_user_id')) {
            $query->where('manufacturer_user_id', $request->input('manufacturer_user_id'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('order_id', 'like', "%{$search}%")
                    ->orWhere('wholesaler_name', 'like', "%{$search}%")
                    ->orWhere('tracking_number', 'like', "%{$search}%");
            });
        }

        $statsQuery = clone $query;
        $stats = [
            'total' => (clone $statsQuery)->count(),
            'active' => (clone $statsQuery)->whereIn('status', ['pending', 'confirmed', 'packed', 'dispatched'])->count(),
            'delivered' => (clone $statsQuery)->where('status', 'delivered')->count(),
            'total_value' => (float) (clone $statsQuery)->where('status', '!=', 'cancelled')->sum('total_amount'),
        ];

        $orders = $query->orderByDesc('created_at')
            ->paginate((int) $request->input('per_page', 20));

        return response()->json([
            'data' => collect($orders->items())->map(fn (ManufacturerOrder $order) => $this->payload($order)),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
            'stats' => $stats,
        ]);
    }

    public function show(Request $request, $id): JsonResponse
    {
        $order = ManufacturerOrder::with(['lineItems', 'manufacturer', 'events'])->findOrFail($id);
        $this->authorize($request->user(), $order);
        return response()->json(['order' => $this->payload($order)]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user->isWholesaler()) {
            abort(403, 'Only wholesaler accounts can place manufacturer orders.');
        }

        $wholesaler = $user->wholesaler;
        if (! $wholesaler) {
            abort(403, 'This account is not linked to a wholesaler record.');
        }

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

        $order = DB::transaction(function () use ($validated, $request, $user, $wholesaler, $manufacturer) {
            $subtotal = 0;
            $lines = [];

            foreach ($validated['items'] as $index => $line) {
                /** @var ManufacturerProduct $product */
                $product = ManufacturerProduct::where('user_id', $manufacturer->id)
                    ->lockForUpdate()
                    ->findOrFail($line['product_id']);

                if ((int) $product->quantity < (int) $line['quantity']) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        "items.{$index}.quantity" => "Only {$product->quantity} units of {$product->name} are available.",
                    ]);
                }

                $unitPrice = (float) $product->wholesale_price;
                if ($unitPrice <= 0) {
                    $unitPrice = (float) $product->selling_price;
                }
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

            $shippingFee = 0;
            $total = round($subtotal + $shippingFee, 2);

            $order = ManufacturerOrder::create([
                'order_id' => $this->generateOrderId(),
                'manufacturer_user_id' => $manufacturer->id,
                'wholesaler_id' => $wholesaler->wholesaler_id,
                'wholesaler_name' => $wholesaler->name,
                'status' => 'pending',
                'payment_method' => $validated['payment_method'] ?? 'credit',
                'payment_status' => ($validated['payment_method'] ?? 'credit') === 'credit' ? 'credit' : 'pending',
                'subtotal' => $subtotal,
                'shipping_fee' => $shippingFee,
                'total_amount' => $total,
                'delivery_address' => $validated['delivery_address'] ?? $wholesaler->address,
                'notes' => $validated['notes'] ?? null,
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? now()->addDays(5)->toDateString(),
            ]);

            foreach ($lines as $line) {
                ManufacturerOrderItem::create([
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

            $this->supplyChain->addManufacturerEvent(
                $order,
                'pending',
                'Order placed',
                'Order sent to '.$manufacturer->manufacturer_name.' for confirmation.',
                $user
            );

            return $order;
        });

        return response()->json([
            'message' => 'Order placed successfully.',
            'order' => $this->payload($order->fresh()->load(['lineItems', 'manufacturer', 'events'])),
        ], 201);
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $order = ManufacturerOrder::with('lineItems')->findOrFail($id);
        $this->authorize($user, $order, true);

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
            return response()->json([
                'message' => "An order that is {$order->status} cannot move to {$target}.",
            ], 422);
        }

        // Only the manufacturer (or admin) may move an order through the
        // fulfilment flow. A wholesaler may only cancel while pending/confirmed.
        if ($user->isWholesaler() && ! in_array($target, ['cancelled'], true)) {
            return response()->json(['message' => 'Only the manufacturer can progress this order.'], 403);
        }

        DB::transaction(function () use ($order, $target, $validated, $request, $user) {
            $updates = ['status' => $target];

            match ($target) {
                'confirmed' => $updates += ['confirmed_at' => now()],
                'packed' => $updates += ['packed_at' => now()],
                'dispatched' => $updates += [
                    'dispatched_at' => now(),
                    'delivery_partner' => $validated['delivery_partner'] ?? 'Manufacturer delivery',
                    'tracking_number' => $validated['tracking_number'] ?? null,
                ],
                'cancelled' => $updates += [
                    'cancelled_at' => now(),
                    'cancellation_reason' => $validated['cancellation_reason'] ?? $validated['notes'] ?? 'Cancelled',
                ],
                default => null,
            };

            if ($validated['notes'] ?? null) {
                $updates['notes'] = $validated['notes'];
            }

            if ($target === 'cancelled') {
                $this->supplyChain->restoreManufacturerStock($order);
                $order->update(['payment_status' => 'failed'] + $updates);
            } elseif ($target === 'delivered') {
                $order->update($updates + ['delivered_at' => now()]);
                $this->supplyChain->receiveManufacturerOrder($order);
                if ($order->payment_method === 'cash') {
                    $order->update(['payment_status' => 'paid']);
                }
            } else {
                $order->update($updates);
            }

            $messages = [
                'confirmed' => ['Order confirmed', 'Manufacturer confirmed the order and started preparing it.'],
                'packed' => ['Order prepared', 'All items are packed and ready for dispatch.'],
                'dispatched' => ['Order on the way', 'The order has left the manufacturer and is coming to you.'],
                'delivered' => ['Order delivered', 'The order reached the wholesaler.'],
                'cancelled' => ['Order cancelled', $updates['cancellation_reason'] ?? 'Cancelled'],
            ];

            $this->supplyChain->addManufacturerEvent(
                $order,
                $target,
                $messages[$target][0],
                $messages[$target][1],
                $user
            );
        });

        return response()->json([
            'message' => 'Order updated.',
            'order' => $this->payload($order->fresh()->load(['lineItems', 'manufacturer', 'events'])),
        ]);
    }

    public function cancel(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $order = ManufacturerOrder::with('lineItems')->findOrFail($id);
        $this->authorize($user, $order, true);

        if (! in_array($order->status, ['pending', 'confirmed'], true)) {
            return response()->json(['message' => 'This order can no longer be cancelled.'], 422);
        }

        DB::transaction(function () use ($order, $request, $user) {
            $this->supplyChain->restoreManufacturerStock($order);
            $order->update([
                'status' => 'cancelled',
                'payment_status' => 'failed',
                'cancelled_at' => now(),
                'cancellation_reason' => $request->input('reason', 'Cancelled by buyer'),
            ]);
            $this->supplyChain->addManufacturerEvent(
                $order,
                'cancelled',
                'Order cancelled',
                $request->input('reason', 'Cancelled by buyer'),
                $user
            );
        });

        return response()->json(['message' => 'Order cancelled.', 'order' => $this->payload($order->fresh()->load(['lineItems', 'manufacturer', 'events']))]);
    }

    public function receive(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $order = ManufacturerOrder::findOrFail($id);
        $this->authorize($user, $order, true);

        if ($order->status !== 'dispatched') {
            return response()->json(['message' => 'Only dispatched orders can be received.'], 422);
        }

        $this->updateStatus($request->merge(['status' => 'delivered']), $id);

        return response()->json(['message' => 'Order received.', 'order' => $this->payload($order->fresh()->load(['lineItems', 'manufacturer', 'events']))]);
    }

    private function authorize($user, ManufacturerOrder $order, bool $strict = false): void
    {
        if ($user->isAdmin()) {
            return;
        }
        if ($user->isManufacturer() && (int) $order->manufacturer_user_id === (int) $user->id) {
            return;
        }
        if ($user->isWholesaler() && $user->wholesaler && $user->wholesaler->wholesaler_id === $order->wholesaler_id) {
            return;
        }
        abort(403, 'You cannot access this order.');
    }

    private function payload(ManufacturerOrder $order): array
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
            'shipping_fee' => (float) $order->shipping_fee,
            'total_amount' => (float) $order->total_amount,
            'delivery_address' => $order->delivery_address,
            'notes' => $order->notes,
            'expected_delivery_date' => $order->expected_delivery_date?->toDateString(),
            'confirmed_at' => $order->confirmed_at?->toIso8601String(),
            'packed_at' => $order->packed_at?->toIso8601String(),
            'dispatched_at' => $order->dispatched_at?->toIso8601String(),
            'delivered_at' => $order->delivered_at?->toIso8601String(),
            'cancelled_at' => $order->cancelled_at?->toIso8601String(),
            'cancellation_reason' => $order->cancellation_reason,
            'tracking_number' => $order->tracking_number,
            'delivery_partner' => $order->delivery_partner,
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

    private function generateOrderId(): string
    {
        do {
            $id = 'MO-'.date('Ymd').'-'.strtoupper(Str::random(6));
        } while (ManufacturerOrder::where('order_id', $id)->exists());

        return $id;
    }
}
