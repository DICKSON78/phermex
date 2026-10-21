<?php

namespace App\Services;

use App\Models\Payment;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;

/**
 * Keeps our record of a payment in step with what ClickPesa reports.
 *
 * The gateway describes a payment with a handful of fields: its own
 * transaction id, its own payment reference, the channel the money came
 * through, the amount it actually collected, the number the prompt went to,
 * and a message that carries the reason when the payment did not go through.
 * Every one of those is kept, because together they are the only evidence of
 * what actually happened to the money.
 */
class ClickPesaPaymentService
{
    public const STATE_PAID = 'paid';

    public const STATE_PENDING = 'pending';

    public const STATE_FAILED = 'failed';

    public const STATE_ON_HOLD = 'on_hold';

    public const STATE_REFUNDED = 'refunded';

    /**
     * The statuses the gateway reports, folded into the states we keep.
     *
     * SUCCESS means the money has been received but is not settled to the
     * merchant account yet, and SETTLED means it has. Both are money that is
     * ours, so both count as paid. A refund or a reversal means the money went
     * back to the customer, so whatever it paid for is no longer paid for.
     * ON-HOLD means the gateway is waiting on the merchant, which is neither a
     * success nor a failure and must not be treated as either.
     */
    public const STATE_MAP = [
        'SUCCESS' => self::STATE_PAID,
        'SETTLED' => self::STATE_PAID,
        'RECEIVED' => self::STATE_PAID,
        'PROCESSING' => self::STATE_PENDING,
        'PENDING' => self::STATE_PENDING,
        'FAILED' => self::STATE_FAILED,
        'ON-HOLD' => self::STATE_ON_HOLD,
        'ON HOLD' => self::STATE_ON_HOLD,
        'REFUNDED' => self::STATE_REFUNDED,
        'REVERSED' => self::STATE_REFUNDED,
        // The event names, for a callback that carries no status of its own.
        'PAYMENT RECEIVED' => self::STATE_PAID,
        'PAYMENT FAILED' => self::STATE_FAILED,
    ];

    /**
     * The state a gateway status or event name means to us.
     */
    public static function state(?string $status): string
    {
        $status = strtoupper(trim((string) $status));

        return self::STATE_MAP[$status] ?? self::STATE_PENDING;
    }

    /**
     * Did the money actually arrive?
     */
    public static function isPaid(?string $status): bool
    {
        return self::state($status) === self::STATE_PAID;
    }

    /**
     * Did the gateway take the money back?
     */
    public static function isRefunded(?string $status): bool
    {
        return self::state($status) === self::STATE_REFUNDED;
    }

    /**
     * Is this a state the payment has come to rest in?
     *
     * A payment that is still being processed has not said anything yet, so it
     * is not an answer. A paid, failed or refunded payment has.
     */
    public static function isSettled(?string $status): bool
    {
        return in_array(self::state($status), [self::STATE_PAID, self::STATE_FAILED, self::STATE_REFUNDED], true);
    }

    /**
     * Pull the fields out of a webhook body or a gateway answer.
     *
     * A webhook wraps everything in a data object; a status query answers with
     * the fields at the top level. Both are accepted here so the same code
     * can record either one.
     *
     * @return array<string, mixed>
     */
    private function fields(array $payload): array
    {
        $data = is_array($payload['data'] ?? null) ? $payload['data'] : $payload;
        $customer = is_array($data['customer'] ?? null) ? $data['customer'] : [];

        return [
            'event' => $payload['event'] ?? $data['event'] ?? null,
            'status' => $data['status'] ?? $payload['status'] ?? null,
            'order_reference' => $data['orderReference'] ?? $payload['orderReference'] ?? $payload['order_reference'] ?? null,
            'payment_reference' => $data['paymentReference'] ?? null,
            'transaction_id' => $data['id'] ?? null,
            'channel' => $data['channel'] ?? null,
            'collected_amount' => $data['collectedAmount'] ?? null,
            'currency' => $data['collectedCurrency'] ?? null,
            'phone' => $data['paymentPhoneNumber'] ?? null,
            'customer_name' => $customer['customerName'] ?? null,
            'customer_email' => $customer['customerEmail'] ?? null,
            'customer_phone' => $customer['customerPhoneNumber'] ?? null,
            'message' => $data['message'] ?? null,
            'created_at' => $data['createdAt'] ?? null,
            'updated_at' => $data['updatedAt'] ?? null,
        ];
    }

    /**
     * Write down what the gateway reported about a payment.
     *
     * The same reference is written many times over the life of a payment: it
     * starts as PROCESSING when the prompt goes out and ends as SUCCESS or
     * FAILED when the customer answers. Each of those is kept on the one row,
     * so the history of a payment stays in one place.
     *
     * @param array<string, mixed> $payload The webhook body or a gateway answer
     * @param array<string, mixed> $context What the payment is about here
     */
    public function record(array $payload, array $context = []): ?Payment
    {
        $fields = $this->fields($payload);
        $reference = $fields['order_reference'] ?: ($context['order_reference'] ?? null);

        if (! $reference) {
            return null;
        }

        $status = $fields['status'] ? strtoupper(trim((string) $fields['status'])) : null;
        $event = $fields['event'] ? strtoupper(trim((string) $fields['event'])) : ($context['event'] ?? null);

        // The status is the gateway's own word for the payment, so it wins over
        // the event name, which only says that something happened.
        $state = self::state($status ?: $event);

        $payment = Payment::withoutGlobalScopes()
            ->where('gateway', 'clickpesa')
            ->where('order_reference', $reference)
            ->first();

        $attributes = [
            'pharmacy_id' => $context['pharmacy_id'] ?? $payment?->pharmacy_id,
            'revenue_record_id' => $context['revenue_record_id'] ?? $payment?->revenue_record_id,
            'subscription_id' => $context['subscription_id'] ?? $payment?->subscription_id,
            'order_id' => $context['order_id'] ?? $payment?->order_id,
            'event' => $event ?: $payment?->event,
            'status' => $status ?: $payment?->status,
            'state' => $state,
            'payment_reference' => $fields['payment_reference'] ?: $payment?->payment_reference,
            'transaction_id' => $fields['transaction_id'] ?: $payment?->transaction_id,
            'channel' => $fields['channel'] ?: $payment?->channel,
            'amount' => $context['amount'] ?? $payment?->amount ?? 0,
            'collected_amount' => $fields['collected_amount'] !== null
                ? $fields['collected_amount']
                : $payment?->collected_amount,
            'fee' => $context['fee'] ?? $payment?->fee,
            'currency' => $fields['currency'] ?: $payment?->currency ?: 'TZS',
            'phone' => $fields['phone'] ?: $payment?->phone,
            'customer_name' => $fields['customer_name'] ?: $payment?->customer_name,
            'customer_email' => $fields['customer_email'] ?: $payment?->customer_email,
            'customer_phone' => $fields['customer_phone'] ?: $payment?->customer_phone,
            'message' => $fields['message'] ?: $payment?->message,
            'payload' => $payload,
            'gateway_created_at' => $this->timestamp($fields['created_at']) ?? $payment?->gateway_created_at,
            'gateway_updated_at' => $this->timestamp($fields['updated_at']) ?? $payment?->gateway_updated_at,
            'paid_at' => $state === self::STATE_PAID
                ? ($payment?->paid_at ?? now())
                : $payment?->paid_at,
        ];

        if ($payment) {
            $payment->update($attributes);

            return $payment;
        }

        try {
            return Payment::create($attributes + [
                'gateway' => 'clickpesa',
                'order_reference' => $reference,
            ]);
        } catch (QueryException $e) {
            // The gateway can deliver the same callback twice, and two calls
            // can race for the same reference. The other one won, so its row
            // is the one to write to.
            $existing = Payment::withoutGlobalScopes()
                ->where('gateway', 'clickpesa')
                ->where('order_reference', $reference)
                ->first();

            if (! $existing) {
                Log::warning('ClickPesa payment could not be recorded: ' . $e->getMessage());

                return null;
            }

            $existing->update($attributes);

            return $existing;
        }
    }

    /**
     * Ask the gateway whether the money really arrived.
     *
     * A callback is a request from the internet, so the gateway is asked to
     * confirm it before anything is granted. The cached answer is used when it
     * has come to rest and agrees with what the callback said, so a callback
     * that lands right after the page polled does not spend another of the
     * calls the account gets in a day.
     *
     * @return array<string, mixed>
     */
    public function confirm(string $orderReference, bool $expectPaid): array
    {
        $cached = cache()->get('clickpesa_status_' . $orderReference);

        if (is_array($cached) && self::isSettled($cached['status'] ?? null)) {
            // The cached answer is only trusted when it says the same thing
            // the callback did. An answer that disagrees is stale, and the
            // gateway is asked again.
            if (self::isPaid($cached['status'] ?? null) === $expectPaid) {
                return $cached;
            }
        }

        return app(ClickPesaService::class)->queryStatus($orderReference, true);
    }

    /**
     * Turn the gateway's timestamps into something the database understands.
     */
    private function timestamp(mixed $value): ?\DateTimeInterface
    {
        if (! $value) {
            return null;
        }

        try {
            return new \DateTimeImmutable((string) $value);
        } catch (\Exception) {
            return null;
        }
    }
}
