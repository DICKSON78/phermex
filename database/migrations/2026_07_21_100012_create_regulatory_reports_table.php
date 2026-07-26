<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('regulatory_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->enum('report_type', [
                'monthly_sales',
                'quarterly_tmda',
                'annual_return',
                'control_substance',
                'expiry_report',
            ]);
            $table->integer('report_period_month');
            $table->integer('report_period_year');
            $table->json('report_data');
            $table->enum('status', ['draft', 'submitted', 'approved'])->default('draft');
            $table->string('submitted_to')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->string('approved_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['pharmacy_id', 'report_type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('regulatory_reports');
    }
};
