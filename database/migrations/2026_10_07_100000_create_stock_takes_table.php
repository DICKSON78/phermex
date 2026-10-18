<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_takes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->string('stock_take_code');
            $table->string('title')->nullable();
            $table->enum('count_type', ['full', 'cycle'])->default('full');
            $table->enum('status', ['draft', 'in_progress', 'completed', 'cancelled'])->default('draft');
            $table->foreignId('category_id')->nullable()->constrained('drug_categories')->nullOnDelete();
            $table->integer('total_items')->default(0);
            $table->integer('counted_items')->default(0);
            $table->integer('variance_total')->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->unique(['pharmacy_id', 'stock_take_code']);
            $table->index(['pharmacy_id', 'status']);
            $table->index(['pharmacy_id', 'created_at']);
        });

        Schema::create('stock_take_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_take_id')->constrained()->cascadeOnDelete();
            $table->foreignId('drug_id')->constrained('drugs')->cascadeOnDelete();
            $table->integer('system_quantity')->default(0);
            $table->integer('counted_quantity')->nullable();
            $table->integer('variance')->default(0);
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->unique(['stock_take_id', 'drug_id']);
            $table->index(['drug_id', 'counted_quantity']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_take_items');
        Schema::dropIfExists('stock_takes');
    }
};
