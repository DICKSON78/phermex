<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('wholesale_order_items', 'inventory_id')) {
            Schema::table('wholesale_order_items', function (Blueprint $table) {
                $table->unsignedBigInteger('inventory_id')->nullable()->after('wholesale_order_id');
                $table->index('inventory_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('wholesale_order_items', 'inventory_id')) {
            Schema::table('wholesale_order_items', function (Blueprint $table) {
                $table->dropIndex(['inventory_id']);
                $table->dropColumn('inventory_id');
            });
        }
    }
};
