<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tax_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->enum('tax_type', ['VAT', 'PAYE', 'NSSF', 'NHIF', 'Housing', 'SDL', 'WHT']);
            $table->unsignedTinyInteger('period_month');
            $table->unsignedSmallInteger('period_year');
            $table->decimal('taxable_amount', 15, 2);
            $table->decimal('tax_amount', 15, 2);
            $table->enum('status', ['draft', 'filed', 'paid'])->default('draft');
            $table->date('filed_date')->nullable();
            $table->date('payment_date')->nullable();
            $table->string('receipt_number')->nullable();
            $table->timestamps();

            $table->unique(['pharmacy_id', 'tax_type', 'period_month', 'period_year']);
            $table->index(['pharmacy_id', 'status']);
            $table->index(['pharmacy_id', 'period_year', 'period_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_records');
    }
};
