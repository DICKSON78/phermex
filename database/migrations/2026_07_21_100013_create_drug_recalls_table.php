<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drug_recalls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('drug_id')->constrained('drugs')->cascadeOnDelete();
            $table->string('recall_number');
            $table->enum('recall_reason', ['defective', 'contamination', 'labeling', 'efficacy', 'safety']);
            $table->enum('severity', ['class_i', 'class_ii', 'class_iii']);
            $table->string('manufacturer');
            $table->json('batch_numbers');
            $table->date('date_issued');
            $table->date('date_acknowledged')->nullable();
            $table->integer('affected_quantity');
            $table->integer('returned_quantity')->default(0);
            $table->enum('status', ['pending', 'acknowledged', 'in_progress', 'completed'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['pharmacy_id', 'status']);
            $table->index(['drug_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drug_recalls');
    }
};
