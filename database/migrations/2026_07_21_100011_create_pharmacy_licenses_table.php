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
            $table->enum('license_type', [
                'pharmacy_license',
                'drug_dealer_license',
                'tmda_registration',
                'business_license',
                'fire_safety',
                'health_certificate',
            ]);
            $table->string('license_number');
            $table->date('issue_date');
            $table->date('expiry_date');
            $table->string('issuing_authority');
            $table->string('document_path')->nullable();
            $table->enum('status', ['active', 'expiring', 'expired', 'suspended'])->default('active');
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
