<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('date');
            $table->timestamp('clock_in')->nullable();
            $table->timestamp('clock_out')->nullable();
            $table->enum('status', ['present', 'absent', 'late', 'half_day', 'leave', 'holiday'])->default('present');
            $table->decimal('hours_worked', 4, 2)->default(0);
            $table->decimal('overtime_hours', 4, 2)->default(0);
            $table->string('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['employee_id', 'date']);
            $table->index(['employee_id', 'status']);
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance');
    }
};
