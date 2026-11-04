<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy;
use App\Models\Subscription;
use App\Services\CRDBCardPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CardPaymentController extends Controller
{
    public function __construct(private CRDBCardPaymentService $crdbService)
    {
    }

    /**
     * Initiate card payment for subscription
     */
    public function initiate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'subscription_id' => 'required|exists:subscriptions,id',
                'card_number' => 'required|string|min:15|max:19',
                'expiry' => 'required|string|regex:/^\d{2}\/\d{2}$/',
                'cvv' => 'required|string|regex:/^\d{3,4}$/',
                'cardholder_name' => 'required|string|max:255',
                'is_recurring' => 'sometimes|boolean',
            ]);

            $subscription = Subscription::with('pharmacy')->findOrFail($validated['subscription_id']);
            $pharmacy = $subscription->pharmacy;

            if (!$pharmacy) {
                return response()->json(['message' => 'Pharmacy not found'], 404);
            }

            // Mask card number for security
            $cardNumber = $validated['card_number'];
            $maskedCard = 'XXXX-XXXX-XXXX-' . substr($cardNumber, -4);

            // Determine if recurring or one-time
            $isRecurring = $validated['is_recurring'] ?? ($pharmacy->subscriptionPlan?->is_monthly ?? false);

            $result = $isRecurring
                ? $this->crdbService->initiateRecurringPayment($pharmacy, $subscription, $validated)
                : $this->crdbService->processOneTimePayment($pharmacy, $subscription, $validated);

            if (!$result['success']) {
                return response()->json(['message' => $result['message']], 400);
            }

            Log::info('Card payment initiated', [
                'pharmacy_id' => $pharmacy->id,
                'subscription_id' => $subscription->id,
                'card' => $maskedCard,
                'is_recurring' => $isRecurring,
            ]);

            return response()->json([
                'message' => 'Payment initiated successfully',
                'transaction_id' => $result['transaction_id'],
                'redirect_url' => $result['redirect_url'] ?? null,
                'is_recurring' => $isRecurring,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Card payment initiation error', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Payment initiation failed'], 500);
        }
    }

    /**
     * Handle webhook from CRDB
     */
    public function webhook(Request $request): JsonResponse
    {
        try {
            $payload = $request->all();

            // Verify webhook signature
            if (!$this->verifyWebhookSignature($payload)) {
                Log::warning('Invalid CRDB webhook signature', ['payload' => $payload]);
                return response()->json(['message' => 'Invalid signature'], 401);
            }

            $success = $this->crdbService->handleWebhook($payload);

            return response()->json(['success' => $success], $success ? 200 : 400);
        } catch (\Exception $e) {
            Log::error('Webhook processing error', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Webhook processing failed'], 500);
        }
    }

    /**
     * Verify webhook signature from CRDB
     */
    private function verifyWebhookSignature(array $payload): bool
    {
        // TODO: Implement signature verification using CRDB's public key
        // For now, accept all webhooks - implement security later
        return true;
    }

    /**
     * Get payment methods for pharmacy
     */
    public function getPaymentMethods(Request $request): JsonResponse
    {
        try {
            $pharmacy = $request->user()->currentPharmacy;

            if (!$pharmacy) {
                return response()->json(['message' => 'No pharmacy found'], 404);
            }

            return response()->json([
                'payment_methods' => [
                    [
                        'id' => 'crdb_card',
                        'name' => 'Bank Card (Visa/Mastercard)',
                        'description' => 'CRDB Bank - Direct card payment',
                        'icon' => 'credit-card',
                        'recurring_available' => true,
                        'is_active' => true,
                    ],
                    [
                        'id' => 'clickpesa',
                        'name' => 'Mobile Money (ClickPesa)',
                        'description' => 'Pay via USSD or Mobile App',
                        'icon' => 'smartphone',
                        'recurring_available' => false,
                        'is_active' => true,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Get payment methods error', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to fetch payment methods'], 500);
        }
    }
}
