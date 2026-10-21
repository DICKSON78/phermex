<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Exceptions\PaymentNotFoundAtGateway;
use App\Models\DeviceToken;
use App\Models\Order;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Pharmacy;
use App\Models\RevenueRecord;
use App\Models\Subscription;
use App\Services\ClickPesaChecksum;
use App\Services\ClickPesaPaymentService;
use App\Services\ClickPesaService;
use App\Services\FcmService;
use App\Services\SubscriptionActivationService;
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

        // The gateway wraps what it sends in a data object: the event name at
        // the top, the details of the payment inside it.
        $event = strtoupper(trim((string) ($payload['event'] ?? $data['event'] ?? '')));

        $orderReference = $data['orderReference']
            ?? $payload['orderReference']
            ?? $payload['order_reference']
            ?? $payload['reference']
            ?? null;

        // The gateway puts the real status in data.status and the event name in
        // event. Reading event first made the status the string
        // "PAYMENT RECEIVED", which only matched by luck on a substring.
        $status = strtoupper(trim((string) ($data['status'] ?? $payload['status'] ?? '')));

        // The gateway's own word for the payment, used when it sends no status
        // of its own.
        $outcome = $status !== '' ? $status : $event;

        Log::info('ClickPesa webhook received', [
            'event' => $event ?: null,
            'status' => $status ?: null,
            'order_reference' => $orderReference,
            'channel' => $data['channel'] ?? null,
            'collected_amount' => $data['collectedAmount'] ?? null,
            'payment_reference' => $data['paymentReference'] ?? null,
            'gateway_transaction_id' => $data['id'] ?? null,
        ]);

        if (empty($orderReference)) {
            return response()->json(['message' => 'Missing order reference.'], 400);
        }

        // Payouts and deposits are not about the packages we sell, so they are
        // acknowledged and left alone.
        if ($event !== '' && ! in_array($event, ['PAYMENT RECEIVED', 'PAYMENT FAILED'], true)) {
            Log::info('ClickPesa webhook event is not a collection event', ['event' => $event]);

            return response()->json(['message' => 'OK']);
        }

        try {
            $payments = app(ClickPesaPaymentService::class);

            $order = Order::where('payment_reference', $orderReference)->first();
            $revenue = RevenueRecord::where('payment_reference', $orderReference)
                ->where('type', 'subscription')
                ->first();

            $subscription = $revenue
                ? Subscription::where('pharmacy_id', $revenue->pharmacy_id)
                    ->where('transaction_id', $orderReference)
                    ->latest('id')
                    ->first()
                : null;

            $context = [
                'pharmacy_id' => $revenue?->pharmacy_id ?? $order?->pharmacy_id,
                'revenue_record_id' => $revenue?->id,
                'subscription_id' => $subscription?->id,
                'order_id' => $order?->id,
                'amount' => $revenue?->amount,
                'event' => $event ?: null,
            ];

            // Written down before anything else happens, so the gateway's own
            // account of the payment survives even when the confirmation below
            // cannot be made.
            $payments->record($payload, $context);

            if ($order) {
                $this->handleOrderPayment($order, $payload, $outcome);
            }

            if ($revenue) {
                return $this->handleSubscriptionPayment($revenue, $orderReference, $context, $outcome);
            }

            return response()->json(['message' => 'OK']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Webhook processing failed.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    /**
     * A payment for something the pharmacy sold.
     */
    private function handleOrderPayment(Order $order, array $payload, string $outcome): void
    {
        $state = ClickPesaPaymentService::state($outcome);

        if ($state === ClickPesaPaymentService::STATE_PAID) {
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

            return;
        }

        if ($state === ClickPesaPaymentService::STATE_FAILED) {
            $order->update(['payment_details' => array_merge((array) ($order->payment_details ?? []), [
                'webhook_status' => 'FAILED',
                'webhook_payload' => $payload,
            ])]);
        }
    }

    /**
     * A payment for a package.
     *
     * The callback says what happened, but the gateway is asked to confirm it
     * before a package is granted: the callback is a request from the internet
     * and only the gateway knows whether the money actually arrived.
     */
    private function handleSubscriptionPayment(RevenueRecord $revenue, string $orderReference, array $context, string $outcome): JsonResponse
    {
        $payments = app(ClickPesaPaymentService::class);

        $expectPaid = $outcome === 'PAYMENT RECEIVED' || ClickPesaPaymentService::isPaid($outcome);

        // Whether the gateway had already told us how this payment ended, so a
        // callback that arrives twice does not tell the owner twice.
        $previousState = Payment::findByReference($orderReference)?->state;

        try {
            $gateway = $payments->confirm($orderReference, $expectPaid);
        } catch (PaymentNotFoundAtGateway $e) {
            // The gateway has no such payment, so retrying cannot help.
            // Acknowledge so it stops calling, and leave the invoice pending
            // for the browser poll to resolve.
            Log::warning('ClickPesa webhook: no such payment at the gateway, nothing to confirm. ' . $e->getMessage());

            return response()->json(['message' => 'Unknown payment reference.'], 200);
        } catch (\Throwable $e) {
            Log::warning('ClickPesa webhook could not confirm with gateway: ' . $e->getMessage());

            // Unknown, not declined. A 500 asks the gateway to retry, whereas
            // answering 2xx would drop this payment for good.
            return response()->json(['message' => 'Could not confirm payment with the gateway.'], 500);
        }

        $gatewayStatus = strtoupper((string) ($gateway['status'] ?? ''));
        $state = ClickPesaPaymentService::state($gatewayStatus !== '' ? $gatewayStatus : $outcome);

        // The gateway's own answer is the last word on the payment.
        $payment = $payments->record($gateway, $context);

        Log::info('ClickPesa subscription payment settled', [
            'order_reference' => $orderReference,
            'gateway_status' => $gatewayStatus,
            'state' => $state,
            'collected_amount' => $gateway['collectedAmount'] ?? null,
            'channel' => $gateway['channel'] ?? null,
        ]);

        if ($state === ClickPesaPaymentService::STATE_PAID) {
            app(SubscriptionActivationService::class)->activate($revenue, $payment);

            return response()->json(['message' => 'OK', 'status' => 'paid']);
        }

        if ($state === ClickPesaPaymentService::STATE_FAILED && $previousState !== ClickPesaPaymentService::STATE_FAILED) {
            $this->markSubscriptionFailed($revenue, $gateway['message'] ?? null);
        } elseif ($state === ClickPesaPaymentService::STATE_REFUNDED && $previousState !== ClickPesaPaymentService::STATE_REFUNDED) {
            $this->revokeSubscription($revenue, $gateway['message'] ?? null);
        }

        return response()->json(['message' => 'OK', 'status' => $state]);
    }

    /**
     * The payment did not go through.
     *
     * The invoice stays open so the owner can try again, but the reason the
     * gateway gave is kept with it and the owner is told.
     */
    private function markSubscriptionFailed(RevenueRecord $revenue, ?string $reason): void
    {
        $pharmacy = Pharmacy::find($revenue->pharmacy_id);

        if ($pharmacy && $pharmacy->payment_status !== 'paid') {
            $pharmacy->update(['payment_status' => 'failed']);
        }

        if ($revenue->status !== 'paid') {
            $note = 'Payment failed' . ($reason ? ': ' . $reason : '.');

            $revenue->update([
                'notes' => trim(($revenue->notes ? $revenue->notes . "\n" : '') . $note),
            ]);
        }

        Notification::create([
            'pharmacy_id' => $revenue->pharmacy_id,
            'user_id' => $pharmacy?->owner_id,
            'title' => 'Subscription Payment Failed',
            'message' => 'Your subscription payment did not go through'
                . ($reason ? ': ' . $reason : '.') . ' Please try again.',
            'type' => 'error',
            'is_read' => false,
            'link' => '/dashboard/subscriptions',
        ]);
    }

    /**
     * The money was taken back, so the package it paid for is no longer paid
     * for.
     */
    private function revokeSubscription(RevenueRecord $revenue, ?string $reason): void
    {
        if ($revenue->status === 'paid') {
            $revenue->update(['status' => 'cancelled']);
        }

        Subscription::where('pharmacy_id', $revenue->pharmacy_id)
            ->where('status', 'active')
            ->update(['status' => 'cancelled']);

        $pharmacy = Pharmacy::find($revenue->pharmacy_id);

        if ($pharmacy) {
            $pharmacy->update([
                'payment_status' => 'refunded',
                'is_published' => false,
            ]);
        }

        Notification::create([
            'pharmacy_id' => $revenue->pharmacy_id,
            'user_id' => $pharmacy?->owner_id,
            'title' => 'Subscription Payment Refunded',
            'message' => 'Your subscription payment was refunded'
                . ($reason ? ': ' . $reason : '.') . ' The plan is no longer active.',
            'type' => 'error',
            'is_read' => false,
            'link' => '/dashboard/subscriptions',
        ]);
    }
}
