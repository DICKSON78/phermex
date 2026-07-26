<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('revenue_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->nullable()->constrained('pharmacies')->cascadeOnDelete();
            $table->enum('type', ['subscription', 'commission', 'service']);
            $table->decimal('amount', 12, 2);
            $table->string('description')->nullable();
            $table->string('invoice_number')->unique();
            $table->enum('status', ['pending', 'paid', 'overdue', 'cancelled'])->default('pending');
            $table->date('due_date');
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_method')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('type');
            $table->index('pharmacy_id');
            $table->index('due_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('revenue_records');
    }
};
