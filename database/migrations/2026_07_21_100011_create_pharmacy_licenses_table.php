<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pharmacy_licenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->string('license_type');
            $table->string('license_number');
            $table->date('issue_date');
            $table->date('expiry_date');
            $table->string('issuing_authority');
            $table->string('document_path')->nullable();
            $table->string('status')->default('active');
            $table->integer('renewal_reminder_days')->default(30);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['pharmacy_id', 'status']);
            $table->index(['pharmacy_id', 'expiry_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pharmacy_licenses');
    }
};
