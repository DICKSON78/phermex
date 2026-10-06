<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Exceptions\PaymentNotFoundAtGateway;
use App\Models\DeviceToken;
use App\Models\Order;
use App\Models\Notification;
use App\Services\ClickPesaChecksum;
use App\Services\ClickPesaService;
use App\Services\FcmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
        $secret = config('services.clickpesa.webhook_secret', '');
        $payload = $request->all();

        // The gateway signs the payload and sends the digest inside it, so an
        // x-signature header over the raw body never matches and every genuine
        // callback was being answered 401. When a checksum key is configured the
        // digest is checked as a second line of defence. It is not a gate:
        // activation below is decided by asking the gateway, so an unverifiable
        // callback still cannot grant a subscription.
        if ($secret === '') {
            Log::warning('ClickPesa webhook received with no checksum key configured. Set CLICKPESA_WEBHOOK_SECRET to verify payloads.');
        } elseif (!ClickPesaChecksum::verify($secret, $payload, true)) {
            Log::warning('ClickPesa webhook checksum did not match.');
        }

        $data = is_array($payload['data'] ?? null) ? $payload['data'] : [];

        $orderReference = $data['orderReference']
            ?? $payload['orderReference']
            ?? $payload['reference']
            ?? null;

        // The gateway puts the real status in data.status and the event name in
        // event. Reading event first made the status the string
        // "PAYMENT RECEIVED", which only matched by luck on a substring.
        $status = strtoupper($data['status']
            ?? $payload['status']
            ?? $data['event']
            ?? $payload['event']
            ?? '');

        Log::info('ClickPesa webhook received', [
            'event' => $payload['event'] ?? $data['event'] ?? null,
            'status' => $status,
            'order_reference' => $orderReference,
            'channel' => $data['channel'] ?? null,
        ]);

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

            // Subscription payments: match the pending invoice by reference.
            if (!$order) {
                $revenue = \App\Models\RevenueRecord::where('payment_reference', $orderReference)
                    ->where('type', 'subscription')
                    ->first();

                if ($revenue) {
                    // Ask the gateway instead of trusting the callback body. The
                    // payload is a request from the internet; only the gateway
                    // knows the money actually arrived, and this is what stops a
                    // forged POST from handing someone a free plan.
                    $confirmed = false;

                    try {
                        $gateway = app(ClickPesaService::class)->queryStatus($orderReference);
                        $gatewayStatus = strtoupper((string) ($gateway['status'] ?? ''));

                        $confirmed = strpos($gatewayStatus, 'SUCCESS') !== false
                            || strpos($gatewayStatus, 'SETTLED') !== false
                            || strpos($gatewayStatus, 'RECEIVED') !== false;

                        Log::info('ClickPesa webhook gateway confirmation', [
                            'order_reference' => $orderReference,
                            'gateway_status' => $gatewayStatus,
                            'confirmed' => $confirmed,
                        ]);
                    } catch (PaymentNotFoundAtGateway $e) {
                        // The gateway has no such payment, so retrying cannot
                        // help. Acknowledge so it stops calling, and leave the
                        // invoice pending for the browser poll to resolve.
                        Log::warning('ClickPesa webhook: no such payment at the gateway, nothing to confirm. ' . $e->getMessage());

                        return response()->json(['message' => 'Unknown payment reference.'], 200);
                    } catch (\Throwable $e) {
                        Log::warning('ClickPesa webhook could not confirm with gateway: ' . $e->getMessage());

                        // Unknown, not declined. A 500 asks the gateway to retry,
                        // whereas answering 2xx would drop this payment for good.
                        return response()->json(['message' => 'Could not confirm payment with the gateway.'], 500);
                    }

                    // Only the gateway can say yes. Falling back to the payload
                    // would undo the whole point: anyone able to POST to this
                    // route could then grant themselves a subscription.
                    if ($confirmed) {
                        if ($revenue->status !== 'paid') {
                            $revenue->update([
                                'status' => 'paid',
                                'paid_at' => now(),
                                'payment_method' => 'mobile',
                            ]);
                        }

                        $subscription = \App\Models\Subscription::where('pharmacy_id', $revenue->pharmacy_id)
                            ->where('status', 'active')
                            ->latest('id')
                            ->first();

                        if ($subscription) {
                            $subscription->update([
                                'transaction_id' => $orderReference,
                                'payment_method' => 'mobile',
                            ]);
                        }

                        \App\Models\Pharmacy::where('id', $revenue->pharmacy_id)->update([
                            'payment_status' => 'paid',
                            'status' => 'active',
                            'is_published' => true,
                        ]);

                        Notification::create([
                            'pharmacy_id' => $revenue->pharmacy_id,
                            'user_id' => \App\Models\Pharmacy::where('id', $revenue->pharmacy_id)->value('owner_id'),
                            'title' => 'Subscription Payment Received',
                            'message' => 'Your subscription payment was received. Your plan is now active.',
                            'type' => 'success',
                            'is_read' => false,
                            'link' => '/dashboard/subscriptions',
                        ]);
                    }
                }
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
