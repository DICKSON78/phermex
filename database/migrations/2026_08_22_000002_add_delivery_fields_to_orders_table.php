<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->text('delivery_address')->nullable()->after('notes');
            $table->string('delivery_phone', 20)->nullable()->after('delivery_address');
            $table->decimal('delivery_latitude', 10, 7)->nullable()->after('delivery_phone');
            $table->decimal('delivery_longitude', 10, 7)->nullable()->after('delivery_latitude');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['delivery_address', 'delivery_phone', 'delivery_latitude', 'delivery_longitude']);
        });
    }
};
