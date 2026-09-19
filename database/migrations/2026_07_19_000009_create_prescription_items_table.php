<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescription_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained('prescriptions')->cascadeOnDelete();
            $table->foreignId('drug_id')->constrained('drugs')->cascadeOnDelete();
            $table->integer('quantity');
            $table->string('dosage')->nullable()->comment('e.g. 500mg');
            $table->string('frequency')->nullable()->comment('e.g. 3x daily');
            $table->string('duration')->nullable()->comment('e.g. 7 days');
            $table->text('notes')->nullable();
            $table->boolean('is_dispensed')->default(false);
            $table->timestamps();

            $table->index('prescription_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescription_items');
    }
};
