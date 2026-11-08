<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wholesalers', function (Blueprint $table) {
            $table->string('business_type', 30)->default('wholesaler')->after('name');
            $table->decimal('delivery_fee', 12, 2)->default(0)->after('bank_name');
            $table->decimal('express_delivery_fee', 12, 2)->default(0)->after('delivery_fee');
            $table->decimal('minimum_order_amount', 12, 2)->default(0)->after('express_delivery_fee');
            $table->unsignedInteger('payment_terms_days')->default(30)->after('minimum_order_amount');
            $table->boolean('accepts_credit')->default(true)->after('payment_terms_days');
        });

        Schema::table('wholesale_inventory', function (Blueprint $table) {
            $table->string('unit', 30)->default('unit')->after('drug_name');
            $table->unsignedInteger('pack_size')->default(1)->after('unit');
            $table->string('category', 120)->nullable()->after('pack_size');
        });

        Schema::table('wholesale_orders', function (Blueprint $table) {
            $table->string('shipment_method', 30)->default('standard')->after('payment_method');
            $table->decimal('shipment_fee', 12, 2)->default(0)->after('total_amount');
            $table->string('payment_status', 30)->default('pending')->after('payment_method');
            $table->string('account_number', 120)->nullable()->after('payment_status');
            $table->string('payment_reference', 120)->nullable()->after('account_number');
            $table->date('expected_delivery_date')->nullable()->after('ordered_at');
            $table->dateTime('prepared_at')->nullable()->after('confirmed_at');
            $table->dateTime('packed_at')->nullable()->after('prepared_at');
            $table->dateTime('cancelled_at')->nullable()->after('delivered_at');
            $table->text('cancellation_reason')->nullable()->after('cancelled_at');
        });

        Schema::table('wholesale_order_items', function (Blueprint $table) {
            $table->string('unit', 30)->default('unit')->after('drug_name');
            $table->unsignedInteger('pack_size')->default(1)->after('unit');
        });

        Schema::create('wholesale_order_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wholesale_order_id')->constrained('wholesale_orders')->onDelete('cascade');
            $table->string('status', 40);
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('actor_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('actor_name')->nullable();
            $table->timestamps();

            $table->index(['wholesale_order_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wholesale_order_events');

        Schema::table('wholesale_order_items', function (Blueprint $table) {
            $table->dropColumn(['unit', 'pack_size']);
        });

        Schema::table('wholesale_orders', function (Blueprint $table) {
            $table->dropColumn([
                'shipment_method',
                'shipment_fee',
                'payment_status',
                'account_number',
                'payment_reference',
                'expected_delivery_date',
                'prepared_at',
                'packed_at',
                'cancelled_at',
                'cancellation_reason',
            ]);
        });

        Schema::table('wholesale_inventory', function (Blueprint $table) {
            $table->dropColumn(['unit', 'pack_size', 'category']);
        });

        Schema::table('wholesalers', function (Blueprint $table) {
            $table->dropColumn([
                'business_type',
                'delivery_fee',
                'express_delivery_fee',
                'minimum_order_amount',
                'payment_terms_days',
                'accepts_credit',
            ]);
        });
    }
};
