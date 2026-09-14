<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Broaden the subscriptions.plan enum to the new tiers (starter/professional)
        // while keeping legacy tiers valid.
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE subscriptions MODIFY plan ENUM('trial','basic','pro','enterprise','starter','professional') NOT NULL DEFAULT 'trial'");
        }

        // Allow storing the ClickPesa order reference on revenue records so the
        // payment webhook can mark a subscription invoice as paid.
        Schema::table('revenue_records', function (Blueprint $table) {
            $table->string('payment_reference')->nullable()->after('invoice_number');
            $table->index('payment_reference');
        });
    }

    public function down(): void
    {
        Schema::table('revenue_records', function (Blueprint $table) {
            $table->dropIndex(['payment_reference']);
            $table->dropColumn('payment_reference');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE subscriptions MODIFY plan ENUM('trial','basic','pro','enterprise') NOT NULL DEFAULT 'trial'");
        }
    }
};