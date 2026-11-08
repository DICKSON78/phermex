<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Manufacturer accounts do not belong to a pharmacy, so their product
        // catalogue lives in its own table instead of borrowing the pharmacy
        // scoped `drugs` table (which requires a pharmacy_id).
        Schema::create('manufacturer_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('generic_name')->nullable();
            $table->string('category')->nullable();
            $table->string('strength')->nullable();
            $table->string('dosage_form')->nullable();
            $table->string('sku')->nullable();
            $table->string('nafdac_number')->nullable();
            $table->string('barcode')->nullable();
            $table->string('batch_number')->nullable();
            $table->text('description')->nullable();
            $table->decimal('cost_price', 12, 2)->default(0);
            $table->decimal('selling_price', 12, 2)->default(0);
            $table->decimal('wholesale_price', 12, 2)->default(0);
            $table->integer('quantity')->default(0);
            $table->integer('reorder_level')->default(10);
            $table->date('expiry_date')->nullable();
            $table->boolean('requires_prescription')->default(false);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'name']);
        });

        Schema::create('manufacturer_recalls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('manufacturer_products')->nullOnDelete();
            $table->string('recall_number');
            $table->string('product_name');
            $table->enum('recall_reason', ['defective', 'contamination', 'labeling', 'efficacy', 'safety']);
            $table->enum('severity', ['class_i', 'class_ii', 'class_iii']);
            $table->string('batch_numbers')->nullable();
            $table->date('date_issued');
            $table->date('date_resolved')->nullable();
            $table->integer('affected_quantity')->default(0);
            $table->integer('returned_quantity')->default(0);
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manufacturer_recalls');
        Schema::dropIfExists('manufacturer_products');
    }
};
