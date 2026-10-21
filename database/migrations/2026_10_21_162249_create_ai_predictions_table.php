<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
            $table->foreignId('drug_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type'); // demand_forecast, sales_forecast, etc.
            $table->date('prediction_date');
            $table->decimal('predicted_value', 12, 2);
            $table->decimal('confidence_lower', 12, 2)->nullable();
            $table->decimal('confidence_upper', 12, 2)->nullable();
            $table->json('model_info')->nullable();
            $table->timestamps();

            $table->index(['pharmacy_id', 'type', 'prediction_date']);
            $table->unique(['pharmacy_id', 'drug_id', 'type', 'prediction_date'], 'unique_ai_prediction');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_predictions');
    }
};