<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            $table->string('order_code');
            $table->enum('status', ['draft', 'submitted', 'approved', 'completed', 'cancelled'])->default('draft');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['pharmacy_id', 'order_code']);
            $table->index(['pharmacy_id', 'status']);
            $table->index(['pharmacy_id', 'created_at']);
            $table->index('supplier_id');
        });

        Schema::create('supplier_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('drug_id')->constrained('drugs')->cascadeOnDelete();
            $table->string('drug_name');
            $table->string('manufacturer')->nullable();
            $table->string('barcode')->nullable();
            $table->integer('quantity_ordered');
            $table->integer('quantity_received')->nullable();
            $table->decimal('buying_price', 12, 2)->nullable();
            $table->decimal('selling_price', 12, 2)->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('batch_number')->nullable();
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->unique(['supplier_order_id', 'drug_id']);
            $table->index('drug_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_order_items');
        Schema::dropIfExists('supplier_orders');
    }
};
