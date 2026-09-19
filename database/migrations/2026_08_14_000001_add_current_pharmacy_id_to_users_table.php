<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('current_pharmacy_id')->nullable()->after('role');
            $table->foreign('current_pharmacy_id')->references('id')->on('pharmacies')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['current_pharmacy_id']);
            $table->dropColumn('current_pharmacy_id');
        });
    }
};
