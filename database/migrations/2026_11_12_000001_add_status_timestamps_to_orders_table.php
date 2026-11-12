<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dateTime('confirmed_at')->nullable()->after('order_status');
            $table->dateTime('preparing_at')->nullable()->after('confirmed_at');
            $table->dateTime('ready_at')->nullable()->after('preparing_at');
            $table->dateTime('out_for_delivery_at')->nullable()->after('ready_at');
            $table->dateTime('delivered_at')->nullable()->after('out_for_delivery_at');
            $table->dateTime('cancelled_at')->nullable()->after('delivered_at');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'confirmed_at',
                'preparing_at',
                'ready_at',
                'out_for_delivery_at',
                'delivered_at',
                'cancelled_at',
            ]);
        });
    }
};
