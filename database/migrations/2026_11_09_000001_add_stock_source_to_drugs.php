<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drugs', function (Blueprint $table) {
            if (! Schema::hasColumn('drugs', 'stock_source')) {
                $table->enum('stock_source', ['manual', 'wholesale', 'transfer', 'opening'])
                    ->default('manual')
                    ->after('quantity');
            }
            if (! Schema::hasColumn('drugs', 'last_received_at')) {
                $table->timestamp('last_received_at')->nullable()->after('stock_source');
            }
        });
    }

    public function down(): void
    {
        Schema::table('drugs', function (Blueprint $table) {
            if (Schema::hasColumn('drugs', 'last_received_at')) {
                $table->dropColumn('last_received_at');
            }
            if (Schema::hasColumn('drugs', 'stock_source')) {
                $table->dropColumn('stock_source');
            }
        });
    }
};
