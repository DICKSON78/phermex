<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('reviewer_id')->constrained('users')->cascadeOnDelete();
            $table->date('review_period_start');
            $table->date('review_period_end');
            $table->decimal('rating', 3, 1);
            $table->decimal('goals_met', 5, 2)->default(0);
            $table->text('strengths')->nullable();
            $table->text('areas_for_improvement')->nullable();
            $table->text('comments')->nullable();
            $table->enum('status', ['draft', 'submitted', 'acknowledged'])->default('draft');
            $table->timestamps();

            $table->index(['employee_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_reviews');
    }
};
