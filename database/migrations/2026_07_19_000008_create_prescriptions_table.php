<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('prescription_code', 20)->unique()->comment('Generated like RX-YYYYXXXXX');
            $table->string('doctor_name');
            $table->string('hospital_name')->nullable();
            $table->text('diagnosis')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'dispensed', 'cancelled'])->default('pending');
            $table->foreignId('dispensed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('dispensed_at')->nullable();
            $table->timestamps();

            $table->index(['pharmacy_id', 'status']);
            $table->index(['pharmacy_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescriptions');
    }
};
