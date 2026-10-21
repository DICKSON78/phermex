<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per payment the gateway tells us about.
        //
        // The invoice in revenue_records says what we billed and whether it was
        // paid. This table says what the gateway itself reported: its own
        // transaction id, its own payment reference, the channel the money came
        // through, the amount it actually collected, and the reason when it
        // did not. Keeping the two apart means an invoice can be corrected
        // without losing the gateway's original record of the event.
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pharmacy_id')->nullable()->constrained('pharmacies')->nullOnDelete();
            $table->foreignId('revenue_record_id')->nullable()->constrained('revenue_records')->nullOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();

            $table->string('gateway')->default('clickpesa');

            // The webhook event name, e.g. PAYMENT RECEIVED or PAYMENT FAILED.
            $table->string('event')->nullable();

            // The status exactly as the gateway spells it: SUCCESS, SETTLED,
            // PROCESSING, PENDING, FAILED, ON-HOLD, REFUNDED or REVERSED.
            $table->string('status')->nullable();

            // The same thing folded into the state we keep our books in.
            $table->string('state')->nullable()->index();

            // Our order reference, and the two the gateway keeps: its own
            // payment reference and its transaction id.
            $table->string('order_reference')->nullable();
            $table->string('payment_reference')->nullable();
            $table->string('transaction_id')->nullable();

            // TIGO-PESA, AIRTEL-MONEY, HALOPESA and so on.
            $table->string('channel')->nullable();

            // What we billed, what the gateway collected, and the fee it took.
            $table->decimal('amount', 12, 2)->default(0);
            $table->decimal('collected_amount', 12, 2)->nullable();
            $table->decimal('fee', 12, 2)->nullable();
            $table->string('currency', 10)->default('TZS');

            // Who paid: the number the prompt went to, and the customer details
            // the gateway passed on.
            $table->string('phone')->nullable();
            $table->string('customer_name')->nullable();
            $table->string('customer_email')->nullable();
            $table->string('customer_phone')->nullable();

            // The gateway's own words, which is where a refusal reason lives.
            $table->text('message')->nullable();

            // The untouched payload, so a dispute can be settled later.
            $table->json('payload')->nullable();

            $table->timestamp('gateway_created_at')->nullable();
            $table->timestamp('gateway_updated_at')->nullable();
            $table->timestamp('paid_at')->nullable();

            $table->timestamps();

            $table->index(['pharmacy_id', 'state']);
            $table->index('order_reference');
            $table->index('payment_reference');
            $table->index('transaction_id');
            $table->unique(['gateway', 'order_reference']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
