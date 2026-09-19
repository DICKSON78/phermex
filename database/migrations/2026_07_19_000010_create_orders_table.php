<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('order_code', 20)->unique()->comment('Generated like ORD-YYYYXXXXX');
            $table->enum('order_type', ['counter', 'online', 'phone'])->default('counter');
            $table->decimal('subtotal', 12, 2);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->enum('payment_method', ['cash', 'card', 'mobile', 'bank'])->default('cash');
            $table->enum('payment_status', ['unpaid', 'partial', 'paid'])->default('unpaid');
            $table->enum('order_status', ['pending', 'confirmed', 'dispensed', 'delivered', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->foreignId('processed_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['pharmacy_id', 'order_status']);
            $table->index(['pharmacy_id', 'payment_status']);
            $table->index(['pharmacy_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
