<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A wholesaler is now a first-class account like a manufacturer. The
        // business record keeps trading data and `user_id` links the login that
        // owns it, so orders can be authorised without trusting request input.
        Schema::table('wholesalers', function (Blueprint $table) {
            if (! Schema::hasColumn('wholesalers', 'user_id')) {
                $table->foreignId('user_id')->nullable()->unique()->after('id')
                    ->constrained('users')->nullOnDelete();
            }
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','owner','pharmacist','cashier','delivery','customer','manufacturer','wholesaler') NOT NULL DEFAULT 'owner'");
        }

        // Wholesalers buy from manufacturers. Manufacturer orders are kept in
        // their own tables so the pharmacy ↔ wholesaler order data model stays
        // untouched and every party only ever queries its own ledger.
        Schema::create('manufacturer_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_id', 40)->unique();
            $table->foreignId('manufacturer_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('wholesaler_id', 40);
            $table->string('wholesaler_name');
            $table->enum('status', ['pending', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled'])->default('pending');
            $table->string('payment_method', 30)->default('credit');
            $table->string('payment_status', 30)->default('pending');
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('shipping_fee', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->string('delivery_address')->nullable();
            $table->text('notes')->nullable();
            $table->date('expected_delivery_date')->nullable();
            $table->dateTime('confirmed_at')->nullable();
            $table->dateTime('packed_at')->nullable();
            $table->dateTime('dispatched_at')->nullable();
            $table->dateTime('delivered_at')->nullable();
            $table->dateTime('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->string('tracking_number', 120)->nullable();
            $table->string('delivery_partner', 120)->nullable();
            $table->timestamps();

            $table->index(['manufacturer_user_id', 'status']);
            $table->index(['wholesaler_id', 'status']);
        });

        Schema::create('manufacturer_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('manufacturer_order_id')->constrained('manufacturer_orders')->cascadeOnDelete();
            $table->foreignId('manufacturer_product_id')->nullable()->constrained('manufacturer_products')->nullOnDelete();
            $table->string('product_name');
            $table->string('sku', 120)->nullable();
            $table->string('batch_number', 120)->nullable();
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('quantity_received')->default(0);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('total_price', 12, 2);
            $table->timestamps();
        });

        Schema::create('manufacturer_order_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('manufacturer_order_id')->constrained('manufacturer_orders')->cascadeOnDelete();
            $table->string('status', 30);
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_name')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manufacturer_order_events');
        Schema::dropIfExists('manufacturer_order_items');
        Schema::dropIfExists('manufacturer_orders');

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','owner','pharmacist','cashier','delivery','customer','manufacturer') NOT NULL DEFAULT 'owner'");
        }

        Schema::table('wholesalers', function (Blueprint $table) {
            if (Schema::hasColumn('wholesalers', 'user_id')) {
                $table->dropConstrainedForeignId('user_id');
            }
        });
    }
};
