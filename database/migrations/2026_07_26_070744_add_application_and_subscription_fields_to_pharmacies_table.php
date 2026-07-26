<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pharmacies', function (Blueprint $table) {
            $table->string('application_status', 20)->default('pending')->after('status');
            $table->foreignId('subscription_plan_id')->nullable()->after('application_status');
            $table->decimal('subscription_amount', 12, 2)->nullable()->after('subscription_plan_id');
            $table->string('payment_status', 20)->default('unpaid')->after('subscription_amount');
            $table->timestamp('subscription_start_date')->nullable()->after('payment_status');
            $table->timestamp('subscription_end_date')->nullable()->after('subscription_start_date');
            $table->timestamp('trial_ends_at')->nullable()->after('subscription_end_date');
            $table->text('rejection_reason')->nullable()->after('trial_ends_at');
        });
    }

    public function down(): void
    {
        Schema::table('pharmacies', function (Blueprint $table) {
            $table->dropColumn([
                'application_status',
                'subscription_plan_id',
                'subscription_amount',
                'payment_status',
                'subscription_start_date',
                'subscription_end_date',
                'rejection_reason',
            ]);
        });
    }
};
