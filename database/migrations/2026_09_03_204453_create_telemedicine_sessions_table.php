<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('telemedicine_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->unsignedBigInteger('pharmacist_user_id')->nullable();
            $table->string('room_code', 64)->unique();
            $table->string('status', 20)->default('requested'); // requested | live | ended | missed
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->foreign('pharmacist_user_id')->references('id')->on('users')->nullOnDelete();
            $table->index(['patient_user_id', 'status']);
            $table->index(['pharmacy_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('telemedicine_sessions');
    }
};