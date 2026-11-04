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
            if (!Schema::hasColumn('subscription_plans', 'grace_period_days')) {
                $table->integer('grace_period_days')->default(3)->after('price');
            }
            if (!Schema::hasColumn('subscription_plans', 'is_monthly')) {
                $table->boolean('is_monthly')->default(false)->after('grace_period_days');
            }
            if (!Schema::hasColumn('subscription_plans', 'payment_gateway')) {
                $table->string('payment_gateway')->nullable()->after('is_monthly');
            }
        });

        // Subscriptions: track grace period
        Schema::table('subscriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('subscriptions', 'grace_period_until')) {
                $table->dateTime('grace_period_until')->nullable()->after('end_date');
            }
            if (!Schema::hasColumn('subscriptions', 'in_grace_period')) {
                $table->boolean('in_grace_period')->default(false)->after('grace_period_until');
            }
        });

        // Pharmacies: track sales visibility preference
        Schema::table('pharmacies', function (Blueprint $table) {
            if (!Schema::hasColumn('pharmacies', 'show_retail_sales')) {
                $table->boolean('show_retail_sales')->default(true)->after('is_published');
            }
            if (!Schema::hasColumn('pharmacies', 'show_wholesale_sales')) {
                $table->boolean('show_wholesale_sales')->default(true)->after('show_retail_sales');
            }
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

        // Orders: differentiate wholesale vs retail (order_type might already exist)
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'order_type')) {
                    $table->enum('order_type', ['retail', 'wholesale'])->default('retail')->after('type');
                }
            });
        }

        // Purchase Orders: tax default 0 (only if table exists)
        if (Schema::hasTable('purchase_orders') && Schema::hasColumn('purchase_orders', 'tax_amount')) {
            // Default is already set in older migrations, skip
        }
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
