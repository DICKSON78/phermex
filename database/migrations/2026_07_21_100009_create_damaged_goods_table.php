<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('damaged_goods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('drug_id')->constrained('drugs')->cascadeOnDelete();
            $table->string('damage_number');
            $table->date('damage_date');
            $table->integer('quantity');
            $table->decimal('unit_cost', 12, 2);
            $table->decimal('total_loss', 15, 2);
            $table->enum('reason', ['expired', 'damaged', 'contaminated', 'stolen', 'recalled']);
            $table->foreignId('reported_by')->constrained('users')->cascadeOnDelete();
            $table->enum('disposal_method', ['returned_to_supplier', 'documented_disposal', 'donated'])->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['pharmacy_id', 'damage_number']);
            $table->index(['pharmacy_id', 'reason']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('damaged_goods');
    }
};
