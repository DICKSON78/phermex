<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add billing_period column if it doesn't exist
        if (!Schema::hasColumn('subscription_plans', 'billing_period')) {
            Schema::table('subscription_plans', function (Blueprint $table) {
                $table->string('billing_period')->default('annual')->after('duration_months');
            });
        }

        // Update existing plans to mark them as annual
        DB::table('subscription_plans')
            ->whereIn('slug', ['starter', 'professional', 'enterprise'])
            ->update(['billing_period' => 'annual']);

        // Remove any monthly plans if they exist (cleanup)
        DB::table('subscription_plans')
            ->whereIn('slug', ['starter-monthly', 'professional-monthly', 'enterprise-monthly', 'monthly-professional'])
            ->delete();
    }

    public function down(): void
    {
        if (Schema::hasColumn('subscription_plans', 'billing_period')) {
            Schema::table('subscription_plans', function (Blueprint $table) {
                $table->dropColumn('billing_period');
            });
        }
    }
};
