<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pharmacies', function (Blueprint $table) {
            $table->boolean('loyalty_enabled')->default(true)->after('slot_gap_minutes');
            $table->decimal('loyalty_points_per_tsh', 10, 4)->default(0.001)->after('loyalty_enabled');
            $table->decimal('loyalty_redeem_tsh_per_point', 10, 2)->default(20.00)->after('loyalty_points_per_tsh');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->boolean('loyalty_awarded')->default(false)->after('processed_by');
        });

        Schema::create('loyalty_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('customer_user_id');
            $table->integer('points');
            $table->string('type')->default('earn'); // earn | redeem | adjust
            $table->unsignedBigInteger('order_id')->nullable();
            $table->string('description', 255)->nullable();
            $table->integer('balance_after')->default(0);
            $table->timestamps();

            $table->index(['pharmacy_id', 'customer_user_id']);
            $table->index('customer_user_id');
            $table->foreign('customer_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_points');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('loyalty_awarded');
        });

        Schema::table('pharmacies', function (Blueprint $table) {
            $table->dropColumn(['loyalty_enabled', 'loyalty_points_per_tsh', 'loyalty_redeem_tsh_per_point']);
        });
    }
};