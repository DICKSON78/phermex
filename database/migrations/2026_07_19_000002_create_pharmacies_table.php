<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pharmacies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('pharmacy_name');
            $table->string('pharmacy_logo')->nullable();
            $table->string('pharmacy_code', 20)->unique()->comment('Generated like PHM-XXXXXX');
            $table->string('license_number')->nullable();
            $table->date('license_expiry')->nullable();
            $table->enum('pharmacy_type', ['independent', 'chain', 'hospital', 'online'])->default('independent');
            $table->string('business_category')->nullable();
            $table->string('country', 100)->default('Nigeria');
            $table->string('region')->nullable();
            $table->string('district')->nullable();
            $table->string('ward')->nullable();
            $table->string('street')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->json('working_days')->nullable()->comment('e.g. ["Mon","Tue","Wed","Thu","Fri","Sat"]');
            $table->json('working_hours')->nullable()->comment('e.g. {"open":"08:00","close":"18:00"}');
            $table->decimal('opening_capital', 15, 2)->default(0);
            $table->decimal('monthly_revenue', 15, 2)->default(0);
            $table->unsignedInteger('total_prescriptions')->default(0);
            $table->unsignedInteger('total_customers')->default(0);
            $table->enum('status', ['pending', 'active', 'suspended', 'closed'])->default('pending');
            $table->boolean('is_published')->default(false);
            $table->timestamp('subscription_expires_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('owner_id');
            $table->index('status');
            $table->index('country');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pharmacies');
    }
};
