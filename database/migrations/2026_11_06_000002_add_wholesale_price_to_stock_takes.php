<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('stock_takes', 'wholesale_price')) {
            Schema::table('stock_takes', function (Blueprint $table) {
                $table->decimal('wholesale_price', 12, 2)->nullable()->after('notes');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('stock_takes', 'wholesale_price')) {
            Schema::table('stock_takes', function (Blueprint $table) {
                $table->dropColumn('wholesale_price');
            });
        }
    }
};
