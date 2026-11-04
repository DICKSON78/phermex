<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ensure payments table exists and has card payment fields
        if (!Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
                $table->foreignId('subscription_id')->nullable()->constrained()->cascadeOnDelete();
                $table->decimal('amount', 15, 2);
                $table->string('currency', 3)->default('TZS');
                $table->enum('gateway', ['clickpesa', 'crdb_card', 'other'])->default('clickpesa');
                $table->enum('status', ['pending', 'paid', 'failed', 'refunded'])->default('pending');
                $table->string('transaction_id')->unique();
                $table->string('payment_method')->nullable();
                $table->json('gateway_response')->nullable();
                $table->timestamps();
                $table->index('status');
                $table->index('gateway');
            });
        } else {
            Schema::table('payments', function (Blueprint $table) {
                if (!Schema::hasColumn('payments', 'gateway')) {
                    $table->enum('gateway', ['clickpesa', 'crdb_card', 'other'])->default('clickpesa')->after('status');
                }
                if (!Schema::hasColumn('payments', 'payment_method')) {
                    $table->string('payment_method')->nullable()->after('transaction_id');
                }
                if (!Schema::hasColumn('payments', 'gateway_response')) {
                    $table->json('gateway_response')->nullable()->after('payment_method');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
