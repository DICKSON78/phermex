<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Pharmacy;
use App\Models\Subscription;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * CRDB Bank Card Payment Service
 * Handles Visa, Mastercard and other bank cards via CRDB gateway
 * Supports recurring/subscription billing
 */
class CRDBCardPaymentService
{
    private const API_URL = 'https://api.crdb.co.tz/payment/v1'; // Replace with actual endpoint
    private const TIMEOUT = 30;

    /**
     * Initialize recurring payment (subscription)
     */
    public function initiateRecurringPayment(Pharmacy $pharmacy, Subscription $subscription, array $cardDetails): array
    {
        try {
            $amount = round((float) $subscription->pharmacy->subscription_amount);
            $currency = 'TZS';

            $payload = [
                'merchant_id' => config('services.crdb.merchant_id'),
                'reference' => "SUB-{$subscription->id}-" . time(),
                'amount' => $amount,
                'currency' => $currency,
                'customer_name' => $pharmacy->owner->name ?? $pharmacy->pharmacy_name,
                'customer_email' => $pharmacy->email,
                'customer_phone' => $pharmacy->phone,
                'card_number' => $cardDetails['card_number'] ?? null,
                'card_expiry' => $cardDetails['expiry'] ?? null,
                'card_cvv' => $cardDetails['cvv'] ?? null,
                'recurring' => true,
                'billing_cycle' => 'MONTHLY',
                'start_date' => now()->toDateTimeString(),
                'description' => "Monthly subscription - {$subscription->pharmacy->subscriptionPlan->name}",
                'webhook_url' => route('api.payments.webhook.crdb'),
                'success_url' => route('subscriptions.success', ['subscription_id' => $subscription->id]),
                'failure_url' => route('subscriptions.failure', ['subscription_id' => $subscription->id]),
            ];

            $response = Http::timeout(self::TIMEOUT)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . config('services.crdb.api_key'),
                    'Content-Type' => 'application/json',
                ])
                ->post(self::API_URL . '/recurring', $payload);

            if (!$response->successful()) {
                Log::error('CRDB recurring payment initiation failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return ['success' => false, 'message' => 'Payment gateway error'];
            }

            $data = $response->json();

            // Store payment record
            Payment::create([
                'pharmacy_id' => $pharmacy->id,
                'subscription_id' => $subscription->id,
                'amount' => $amount,
                'currency' => $currency,
                'gateway' => 'crdb_card',
                'status' => 'pending',
                'transaction_id' => $data['transaction_id'] ?? $payload['reference'],
                'gateway_response' => $data,
                'payment_method' => 'recurring_card',
            ]);

            Log::info('CRDB recurring payment initiated', [
                'pharmacy_id' => $pharmacy->id,
                'transaction_id' => $data['transaction_id'] ?? null,
            ]);

            return [
                'success' => true,
                'transaction_id' => $data['transaction_id'] ?? $payload['reference'],
                'redirect_url' => $data['redirect_url'] ?? null,
            ];
        } catch (\Exception $e) {
            Log::error('CRDB payment service error', ['error' => $e->getMessage()]);
            return ['success' => false, 'message' => 'Payment processing error'];
        }
    }

    /**
     * Process one-time card payment
     */
    public function processOneTimePayment(Pharmacy $pharmacy, Subscription $subscription, array $cardDetails): array
    {
        try {
            $amount = round((float) $subscription->pharmacy->subscription_amount);

            $payload = [
                'merchant_id' => config('services.crdb.merchant_id'),
                'reference' => "PAY-{$subscription->id}-" . time(),
                'amount' => $amount,
                'currency' => 'TZS',
                'customer_name' => $pharmacy->owner->name ?? $pharmacy->pharmacy_name,
                'customer_email' => $pharmacy->email,
                'customer_phone' => $pharmacy->phone,
                'card_number' => $cardDetails['card_number'] ?? null,
                'card_expiry' => $cardDetails['expiry'] ?? null,
                'card_cvv' => $cardDetails['cvv'] ?? null,
                'description' => "Subscription payment - {$subscription->pharmacy->subscriptionPlan->name}",
                'webhook_url' => route('api.payments.webhook.crdb'),
            ];

            $response = Http::timeout(self::TIMEOUT)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . config('services.crdb.api_key'),
                    'Content-Type' => 'application/json',
                ])
                ->post(self::API_URL . '/charge', $payload);

            if (!$response->successful()) {
                return ['success' => false, 'message' => 'Payment failed'];
            }

            $data = $response->json();

            Payment::create([
                'pharmacy_id' => $pharmacy->id,
                'subscription_id' => $subscription->id,
                'amount' => $amount,
                'currency' => 'TZS',
                'gateway' => 'crdb_card',
                'status' => $data['status'] === 'SUCCESS' ? 'paid' : 'failed',
                'transaction_id' => $data['transaction_id'] ?? $payload['reference'],
                'gateway_response' => $data,
                'payment_method' => 'card',
            ]);

            return [
                'success' => $data['status'] === 'SUCCESS',
                'transaction_id' => $data['transaction_id'] ?? null,
                'message' => $data['message'] ?? 'Payment processed',
            ];
        } catch (\Exception $e) {
            Log::error('CRDB one-time payment error', ['error' => $e->getMessage()]);
            return ['success' => false, 'message' => 'Payment processing failed'];
        }
    }

    /**
     * Handle webhook from CRDB
     */
    public function handleWebhook(array $payload): bool
    {
        try {
            $transactionId = $payload['transaction_id'] ?? null;
            $status = $payload['status'] ?? null;

            if (!$transactionId || !$status) {
                Log::warning('Invalid CRDB webhook payload', $payload);
                return false;
            }

            $payment = Payment::where('transaction_id', $transactionId)->first();

            if (!$payment) {
                Log::warning('CRDB webhook: Transaction not found', ['transaction_id' => $transactionId]);
                return false;
            }

            // Update payment status
            $statusMap = [
                'SUCCESS' => 'paid',
                'FAILED' => 'failed',
                'PENDING' => 'pending',
                'REFUNDED' => 'refunded',
            ];

            $payment->update([
                'status' => $statusMap[$status] ?? 'pending',
                'gateway_response' => array_merge($payment->gateway_response ?? [], $payload),
            ]);

            // If successful, activate subscription
            if ($status === 'SUCCESS' && $payment->subscription) {
                $this->activateSubscription($payment->subscription);
            }

            Log::info('CRDB webhook processed', [
                'transaction_id' => $transactionId,
                'status' => $status,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('CRDB webhook processing error', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Activate subscription after successful payment
     */
    private function activateSubscription(Subscription $subscription): void
    {
        $subscription->update([
            'status' => 'active',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonths($subscription->pharmacy->subscriptionPlan->duration_months)->toDateString(),
        ]);

        $subscription->pharmacy->update([
            'payment_status' => 'paid',
            'is_published' => true,
            'status' => 'active',
        ]);
    }
}
