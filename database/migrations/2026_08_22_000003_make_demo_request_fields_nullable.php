<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('demo_requests', function (Blueprint $table) {
            $table->string('phone', 20)->nullable()->change();
            $table->string('service')->nullable()->change();
            $table->text('message')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('demo_requests', function (Blueprint $table) {
            $table->string('phone')->nullable(false)->change();
        });
    }
};
