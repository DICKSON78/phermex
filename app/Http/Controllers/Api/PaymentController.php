<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceToken;
use App\Models\Order;
use App\Models\Notification;
use App\Services\ClickPesaService;
use App\Services\FcmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function registerDeviceToken(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'device_token' => 'required|string|max:500',
            'platform' => 'sometimes|in:android,ios',
        ]);

        try {
            $exists = DeviceToken::where('user_id', $request->user()->id)
                ->where('device_token', $validated['device_token'])
                ->exists();

            if (!$exists) {
                DeviceToken::create([
                    'user_id' => $request->user()->id,
                    'device_token' => $validated['device_token'],
                    'platform' => $validated['platform'] ?? 'android',
                ]);
            }

            return response()->json(['message' => 'Device token registered.']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to register device.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function queryPaymentStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|integer',
        ]);

        try {
            $order = Order::where('user_id', $request->user()->id)
                ->findOrFail($validated['order_id']);

            if ($order->payment_method !== 'mobile' || empty($order->payment_reference)) {
                return response()->json([
                    'message' => 'Not a mobile money order.',
                    'status' => $order->payment_status,
                ]);
            }

            $service = app(ClickPesaService::class);

            if (!$service->enabled()) {
                return response()->json([
                    'message' => 'Payment gateway not configured.',
                    'status' => $order->payment_status,
                ]);
            }

            $status = $service->queryStatus($order->payment_reference);
            $gatewayStatus = strtoupper($status['status'] ?? 'PROCESSING');

            if ($gatewayStatus === 'SUCCESS' || $gatewayStatus === 'SETTLED') {
                if ($order->payment_status !== 'paid') {
                    $order->update([
                        'payment_status' => 'paid',
                        'payment_details' => array_merge((array) ($order->payment_details ?? []), [
                            'final_status' => $gatewayStatus,
                        ]),
                    ]);

                    Notification::create([
                        'pharmacy_id' => $order->pharmacy_id,
                        'user_id' => $order->pharmacy->owner_id ?? null,
                        'title' => 'Payment Received',
                        'message' => "Payment received for order #{$order->order_code} via mobile money.",
                        'type' => 'info',
                        'is_read' => false,
                        'link' => "/dashboard/orders/{$order->id}",
                    ]);
                }
            } elseif ($gatewayStatus === 'FAILED') {
                $order->update(['payment_details' => array_merge((array) ($order->payment_details ?? []), [
                    'final_status' => 'FAILED',
                ])]);
            }

            return response()->json([
                'message' => 'Payment status retrieved.',
                'status' => $order->payment_status,
                'gateway_status' => $gatewayStatus,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Order not found.'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to query payment status.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function handleWebhook(Request $request): JsonResponse
    {
        $payload = $request->all();

        $orderReference = $payload['orderReference']
            ?? $payload['reference']
            ?? ($payload['data']['orderReference'] ?? null);

        $status = strtoupper($payload['status']
            ?? $payload['event']
            ?? ($payload['data']['status'] ?? ''));

        if (empty($orderReference)) {
            return response()->json(['message' => 'Missing order reference.'], 400);
        }

        try {
            $order = Order::where('payment_reference', $orderReference)->first();

            if ($order && (strpos($status, 'SUCCESS') !== false || strpos($status, 'SETTLED') !== false || strpos($status, 'RECEIVED') !== false)) {
                $order->update([
                    'payment_status' => 'paid',
                    'payment_details' => array_merge((array) ($order->payment_details ?? []), [
                        'webhook_received' => true,
                        'webhook_payload' => $payload,
                    ]),
                ]);

                Notification::create([
                    'pharmacy_id' => $order->pharmacy_id,
                    'user_id' => $order->pharmacy->owner_id ?? null,
                    'title' => 'Payment Received',
                    'message' => "Payment received for order #{$order->order_code} via mobile money.",
                    'type' => 'info',
                    'is_read' => false,
                    'link' => "/dashboard/orders/{$order->id}",
                ]);

                app(FcmService::class)->sendToUser(
                    $order->user_id,
                    'Payment Confirmed',
                    'Your payment for order ' . $order->order_code . ' was successful.'
                );
            } elseif ($order && (strpos($status, 'FAILED') !== false)) {
                $order->update(['payment_details' => array_merge((array) ($order->payment_details ?? []), [
                    'webhook_status' => 'FAILED',
                ])]);
            }

            return response()->json(['message' => 'OK']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Webhook processing failed.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
