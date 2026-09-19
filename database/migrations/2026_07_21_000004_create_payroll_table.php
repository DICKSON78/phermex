<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->integer('period_month');
            $table->integer('period_year');
            $table->decimal('basic_salary', 12, 2);
            $table->decimal('allowances', 12, 2)->default(0);
            $table->decimal('overtime_pay', 12, 2)->default(0);
            $table->decimal('gross_salary', 12, 2);
            $table->decimal('paye_tax', 12, 2)->default(0);
            $table->decimal('nssf_employee', 12, 2)->default(0);
            $table->decimal('nssf_employer', 12, 2)->default(0);
            $table->decimal('nhif', 12, 2)->default(0);
            $table->decimal('housing_levy', 12, 2)->default(0);
            $table->decimal('other_deductions', 12, 2)->default(0);
            $table->decimal('net_salary', 12, 2);
            $table->enum('status', ['draft', 'pending', 'approved', 'paid', 'cancelled'])->default('draft');
            $table->date('paid_date')->nullable();
            $table->enum('payment_method', ['bank', 'cash', 'mobile'])->default('bank');
            $table->timestamps();

            $table->unique(['employee_id', 'period_month', 'period_year']);
            $table->index(['pharmacy_id', 'period_month', 'period_year']);
            $table->index(['pharmacy_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll');
    }
};
