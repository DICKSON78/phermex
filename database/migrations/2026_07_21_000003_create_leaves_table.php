<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leaves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->enum('leave_type', ['annual', 'sick', 'maternity', 'paternity', 'bereavement', 'unpaid', 'study']);
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('days_count');
            $table->string('reason');
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('approval_date')->nullable();
            $table->string('rejection_reason')->nullable();
            $table->timestamps();

            $table->index(['employee_id', 'status']);
            $table->index(['employee_id', 'leave_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leaves');
    }
};
