<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wholesale_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_id')->unique(); // WO-YYYYMMDD-XXXXXX
            $table->foreignId('eprescription_id')->nullable()->constrained('eprescriptions')->onDelete('set null');
            $table->string('prescription_id')->nullable();
            $table->string('pharmacy_id'); // Retail pharmacy placing order
            $table->string('wholesaler_id'); // Wholesaler fulfilling
            $table->json('items'); // Array of {drug_id, quantity, unit_price}
            $table->decimal('total_amount', 12, 2);
            $table->string('delivery_address');
            $table->enum('payment_method', ['bank_transfer', 'credit', 'cash', 'cheque'])->default('bank_transfer');
            $table->enum('status', ['pending', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled'])->default('pending');
            $table->dateTime('ordered_at');
            $table->dateTime('confirmed_at')->nullable();
            $table->dateTime('dispatched_at')->nullable();
            $table->dateTime('delivered_at')->nullable();
            $table->text('notes')->nullable();
            $table->string('delivery_partner')->nullable();
            $table->string('tracking_number')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('pharmacy_id');
            $table->index('wholesaler_id');
            $table->index('status');
            $table->index('ordered_at');
        });

        Schema::create('wholesale_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wholesale_order_id')->constrained('wholesale_orders')->onDelete('cascade');
            $table->string('drug_id');
            $table->string('drug_name');
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 12, 2); // quantity * unit_price
            $table->integer('quantity_received')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('wholesale_order_id');
        });

        Schema::create('wholesale_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wholesale_order_id')->constrained('wholesale_orders')->onDelete('cascade');
            $table->decimal('amount', 12, 2);
            $table->enum('payment_method', ['bank_transfer', 'credit', 'cash', 'cheque'])->default('bank_transfer');
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
            $table->string('transaction_reference')->nullable();
            $table->string('payment_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('wholesale_order_id');
            $table->index('status');
        });

        Schema::create('wholesale_pricing', function (Blueprint $table) {
            $table->id();
            $table->string('drug_id');
            $table->string('wholesaler_id');
            $table->decimal('price', 10, 2);
            $table->integer('minimum_quantity');
            $table->decimal('discount_percentage', 5, 2)->default(0);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->dateTime('valid_from');
            $table->dateTime('valid_until')->nullable();
            $table->timestamps();

            $table->unique(['drug_id', 'wholesaler_id']);
            $table->index('wholesaler_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wholesale_pricing');
        Schema::dropIfExists('wholesale_payments');
        Schema::dropIfExists('wholesale_order_items');
        Schema::dropIfExists('wholesale_orders');
    }
};
