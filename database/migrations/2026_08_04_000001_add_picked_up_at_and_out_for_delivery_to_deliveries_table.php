<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->timestamp('picked_up_at')->nullable()->after('assigned_to');
            $table->enum('status', [
                'pending',
                'assigned',
                'picked_up',
                'in_transit',
                'out_for_delivery',
                'delivered',
                'failed',
            ])->default('pending')->change();
        });
    }

    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropColumn('picked_up_at');
            $table->enum('status', [
                'pending',
                'assigned',
                'picked_up',
                'in_transit',
                'delivered',
                'failed',
            ])->default('pending')->change();
        });
    }
};
