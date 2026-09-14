<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('insurance_providers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pharmacy_id')->nullable();
            $table->string('name');
            $table->string('code')->nullable();
            $table->string('contact_phone', 30)->nullable();
            $table->string('contact_email')->nullable();
            $table->string('website')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('pharmacy_id')->references('id')->on('pharmacies')->onDelete('cascade');
            $table->index('pharmacy_id');
        });

        Schema::create('patient_insurances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('customer_user_id');
            $table->foreignId('insurance_provider_id')->constrained()->onDelete('cascade');
            $table->string('policy_number', 50);
            $table->string('group_number', 50)->nullable();
            $table->string('member_id', 50)->nullable();
            $table->string('holder_name')->nullable();
            $table->string('relationship')->default('self');
            $table->date('expiry_date')->nullable();
            $table->decimal('coverage_percent', 5, 2)->default(0);
            $table->boolean('is_primary')->default(true);
            $table->timestamps();

            $table->index(['pharmacy_id', 'customer_user_id']);
            $table->index('customer_user_id');
            $table->foreign('customer_user_id')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::create('insurance_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained()->onDelete('cascade');
            $table->foreignId('patient_insurance_id')->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('order_id')->nullable();
            $table->string('claim_number', 30)->unique();
            $table->decimal('total_amount', 12, 2);
            $table->decimal('approved_amount', 12, 2)->nullable();
            $table->decimal('patient_copay', 12, 2)->nullable();
            $table->string('status')->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->text('notes')->nullable();
            $table->text('pharmacist_notes')->nullable();
            $table->unsignedBigInteger('processed_by')->nullable();
            $table->timestamps();

            $table->index(['pharmacy_id', 'status']);
            $table->index('order_id');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('insurance_claims');
        Schema::dropIfExists('patient_insurances');
        Schema::dropIfExists('insurance_providers');
    }
};