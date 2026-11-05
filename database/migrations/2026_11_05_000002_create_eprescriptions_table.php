<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('eprescriptions', function (Blueprint $table) {
            $table->id();
            $table->string('prescription_id')->unique();
            $table->string('patient_id');
            $table->string('patient_name');
            $table->string('patient_phone');
            $table->string('patient_email')->nullable();
            $table->date('patient_dob');
            $table->string('patient_national_id');
            $table->string('healthcare_facility');
            $table->string('moh_facility_code');
            $table->string('prescriber_name');
            $table->string('prescriber_license');
            $table->string('prescriber_specialty');
            $table->text('notes')->nullable();
            $table->dateTime('valid_until');
            $table->enum('status', ['pending', 'fulfilled', 'expired', 'cancelled'])->default('pending');
            $table->string('qr_code')->nullable();
            $table->dateTime('fulfilled_at')->nullable();
            $table->string('fulfilled_by_pharmacy')->nullable();
            $table->text('fulfillment_notes')->nullable();
            $table->timestamps();

            $table->index('prescription_id');
            $table->index('patient_id');
            $table->index('status');
            $table->index('valid_until');
        });

        Schema::create('eprescription_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('eprescription_id')->constrained('eprescriptions')->onDelete('cascade');
            $table->string('drug_name');
            $table->string('dosage');
            $table->integer('quantity');
            $table->string('frequency');
            $table->integer('duration_days');
            $table->text('instructions')->nullable();
            $table->timestamps();

            $table->index('eprescription_id');
        });

        Schema::create('api_integrations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('system_type', ['laravel', 'nodejs', 'spring', 'other'])->default('other');
            $table->string('api_key')->unique();
            $table->text('api_key_hash');
            $table->string('organization')->nullable();
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->string('rate_limit')->default('1000/hour');
            $table->text('allowed_endpoints')->nullable();
            $table->dateTime('created_at');
            $table->dateTime('last_used_at')->nullable();
            $table->timestamps();

            $table->index('api_key');
            $table->index('status');
        });

        Schema::create('delivery_tracking', function (Blueprint $table) {
            $table->id();
            $table->foreignId('eprescription_id')->nullable()->constrained('eprescriptions')->onDelete('set null');
            $table->string('prescription_id');
            $table->string('order_id')->nullable();
            $table->enum('status', ['pending', 'dispatched', 'in_transit', 'delivered', 'failed'])->default('pending');
            $table->string('delivery_partner')->nullable();
            $table->string('vehicle_info')->nullable();
            $table->string('driver_phone')->nullable();
            $table->dateTime('dispatched_at')->nullable();
            $table->dateTime('delivered_at')->nullable();
            $table->text('delivery_notes')->nullable();
            $table->json('location_history')->nullable();
            $table->timestamps();

            $table->index('prescription_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_tracking');
        Schema::dropIfExists('api_integrations');
        Schema::dropIfExists('eprescription_items');
        Schema::dropIfExists('eprescriptions');
    }
};
