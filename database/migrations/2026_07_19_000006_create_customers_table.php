<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->string('customer_code', 20)->unique()->comment('Generated like CUS-XXXXXX');
            $table->string('full_name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->text('allergies')->nullable();
            $table->text('medical_conditions')->nullable();
            $table->string('location')->nullable();
            $table->string('street')->nullable();
            $table->boolean('is_guest')->default(false);
            $table->timestamps();

            $table->index(['pharmacy_id', 'phone']);
            $table->index(['pharmacy_id', 'full_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
