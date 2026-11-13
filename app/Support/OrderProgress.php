<?php

namespace App\Support;

use App\Models\Order;

/**
 * Canonical customer-order progress payload.
 *
 * The dashboard renders customer orders with the shared OrderFlowProgress
 * component, but the mobile client only receives JSON. Returning the stages
 * (and their completion timestamps) from the API keeps both clients in step
 * with the same six-step preparation → delivery flow.
 */
final class OrderProgress
{
    public const STAGES = [
        ['key' => 'pending', 'label' => 'Order placed', 'short' => 'Placed'],
        ['key' => 'confirmed', 'label' => 'Confirmed', 'short' => 'Confirmed'],
        ['key' => 'preparing', 'label' => 'Preparing', 'short' => 'Preparing'],
        ['key' => 'ready', 'label' => 'Ready', 'short' => 'Ready'],
        ['key' => 'out_for_delivery', 'label' => 'Out for delivery', 'short' => 'On the way'],
        ['key' => 'delivered', 'label' => 'Delivered', 'short' => 'Delivered'],
    ];

    private const TIMESTAMP_FIELDS = [
        'pending' => 'created_at',
        'confirmed' => 'confirmed_at',
        'preparing' => 'preparing_at',
        'ready' => 'ready_at',
        'out_for_delivery' => 'out_for_delivery_at',
        'delivered' => 'delivered_at',
    ];

    /**
     * A dispensed counter sale is finished exactly like a delivered one.
     */
    private const STATUS_ALIASES = ['dispensed' => 'delivered'];

    public static function for(Order $order): array
    {
        $status = $order->order_status ?: 'pending';
        $normalized = self::STATUS_ALIASES[$status] ?? $status;
        $cancelled = $status === 'cancelled';
        $currentIndex = $cancelled
            ? -1
            : array_search($normalized, array_column(self::STAGES, 'key'), true);

        $stages = [];
        foreach (self::STAGES as $index => $stage) {
            $field = self::TIMESTAMP_FIELDS[$stage['key']];
            $at = $order->{$field};

            $stages[] = [
                'key' => $stage['key'],
                'label' => $stage['label'],
                'short' => $stage['short'],
                'completed' => ! $cancelled && $currentIndex !== false && $index < $currentIndex,
                'active' => ! $cancelled && $currentIndex !== false && $index === $currentIndex,
                'at' => $at?->toIso8601String(),
            ];
        }

        return [
            'type' => 'customer',
            'status' => $status,
            'current' => $cancelled ? 'cancelled' : ($normalized ?: 'pending'),
            'cancelled' => $cancelled,
            'cancelled_at' => $order->cancelled_at?->toIso8601String(),
            'stages' => $stages,
            'timestamps' => collect(self::TIMESTAMP_FIELDS)
                ->map(fn (string $field) => $order->{$field}?->toIso8601String())
                ->filter()
                ->all(),
        ];
    }
}
