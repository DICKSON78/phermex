<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drugs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('drug_categories')->nullOnDelete();
            $table->string('name');
            $table->string('generic_name')->nullable();
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('manufacturer')->nullable();
            $table->string('nafdac_number')->nullable();
            $table->string('barcode')->nullable();
            $table->decimal('buying_price', 12, 2);
            $table->decimal('selling_price', 12, 2);
            $table->decimal('wholesale_price', 12, 2)->default(0);
            $table->integer('quantity')->default(0);
            $table->enum('unit', ['tablets', 'capsules', 'bottles', 'tubes', 'vials'])->default('tablets');
            $table->integer('reorder_level')->default(10);
            $table->date('expiry_date');
            $table->string('batch_number')->nullable();
            $table->boolean('requires_prescription')->default(false);
            $table->boolean('is_generic')->default(false);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['pharmacy_id', 'category_id']);
            $table->index('slug');
            $table->index('barcode');
            $table->index('expiry_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drugs');
    }
};
