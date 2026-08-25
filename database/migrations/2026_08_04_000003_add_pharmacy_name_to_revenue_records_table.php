<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('revenue_records', function (Blueprint $table) {
            $table->string('pharmacy_name')->nullable()->after('pharmacy_id');
        });
    }

    public function down(): void
    {
        Schema::table('revenue_records', function (Blueprint $table) {
            $table->dropColumn('pharmacy_name');
        });
    }
};
