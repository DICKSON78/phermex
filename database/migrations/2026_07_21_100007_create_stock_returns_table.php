<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            $table->string('return_number');
            $table->date('return_date');
            $table->enum('reason', ['damaged', 'expired', 'wrong_item', 'quality_issue', 'overstock']);
            $table->enum('status', ['pending', 'approved', 'shipped', 'refunded'])->default('pending');
            $table->integer('total_items')->default(0);
            $table->decimal('total_value', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['pharmacy_id', 'return_number']);
            $table->index(['pharmacy_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_returns');
    }
};
