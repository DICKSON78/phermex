<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('employee_number');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email');
            $table->string('phone');
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->default('male');
            $table->string('national_id')->nullable();
            $table->string('position');
            $table->enum('department', ['pharmacy', 'management', 'finance', 'operations', 'hr'])->default('pharmacy');
            $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'intern'])->default('full_time');
            $table->date('hire_date');
            $table->date('contract_end_date')->nullable();
            $table->decimal('basic_salary', 12, 2)->default(0);
            $table->decimal('allowances', 12, 2)->default(0);
            $table->string('tax_id')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->enum('status', ['active', 'inactive', 'suspended', 'terminated'])->default('active');
            $table->string('profile_photo')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['pharmacy_id', 'employee_number']);
            $table->index(['pharmacy_id', 'status']);
            $table->index(['pharmacy_id', 'department']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
