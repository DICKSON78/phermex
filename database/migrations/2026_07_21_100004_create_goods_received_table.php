<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('goods_received', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders')->cascadeOnDelete();
            $table->string('grn_number');
            $table->date('received_date');
            $table->foreignId('received_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            $table->integer('total_items');
            $table->decimal('total_value', 15, 2);
            $table->enum('status', ['complete', 'partial'])->default('complete');
            $table->enum('quality_check', ['passed', 'failed', 'pending'])->default('pending');
            $table->text('quality_notes')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['pharmacy_id', 'grn_number']);
            $table->index(['pharmacy_id', 'received_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('goods_received');
    }
};
