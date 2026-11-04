<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Subscription plans: add grace period and monthly plan
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->integer('grace_period_days')->default(3)->after('price');
            $table->boolean('is_monthly')->default(false)->after('grace_period_days');
            $table->string('payment_gateway')->nullable()->after('is_monthly');
        });

        // Subscriptions: track grace period
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dateTime('grace_period_until')->nullable()->after('end_date');
            $table->boolean('in_grace_period')->default(false)->after('grace_period_until');
            $table->string('payment_method')->change(); // already exists
        });

        // Pharmacies: track sales visibility preference
        Schema::table('pharmacies', function (Blueprint $table) {
            $table->boolean('show_retail_sales')->default(true)->after('is_published');
            $table->boolean('show_wholesale_sales')->default(true)->after('show_retail_sales');
        });

        // Products/Drugs: add wholesale pricing (only if columns don't exist)
        Schema::table('drugs', function (Blueprint $table) {
            if (!Schema::hasColumn('drugs', 'wholesale_price')) {
                $table->decimal('wholesale_price', 12, 2)->nullable()->after('selling_price');
            }
            if (!Schema::hasColumn('drugs', 'wholesale_quantity_min')) {
                $table->decimal('wholesale_quantity_min', 10, 2)->default(10)->after('wholesale_price');
            }
            if (!Schema::hasColumn('drugs', 'is_wholesale_available')) {
                $table->boolean('is_wholesale_available')->default(false)->after('wholesale_quantity_min');
            }
        });

        // Orders: differentiate wholesale vs retail
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('order_type', ['retail', 'wholesale'])->default('retail')->after('type');
            $table->decimal('tax', 12, 2)->default(0)->change(); // Change default to 0
        });

        // Purchase Orders: tax default 0
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->decimal('tax_amount', 12, 2)->default(0)->change();
        });
    }

    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->dropColumn(['grace_period_days', 'is_monthly', 'payment_gateway']);
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn(['grace_period_until', 'in_grace_period']);
        });

        Schema::table('pharmacies', function (Blueprint $table) {
            $table->dropColumn(['show_retail_sales', 'show_wholesale_sales']);
        });

        Schema::table('drugs', function (Blueprint $table) {
            $table->dropColumn(['wholesale_price', 'wholesale_quantity_min', 'is_wholesale_available']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['order_type']);
        });
    }
};
