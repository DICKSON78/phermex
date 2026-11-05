<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Wholesalers table
        Schema::create('wholesalers', function (Blueprint $table) {
            $table->id();
            $table->string('wholesaler_id')->unique(); // WHOLE-001
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone');
            $table->text('address');
            $table->string('city');
            $table->string('region');
            $table->string('country')->default('Tanzania');
            $table->string('license_number')->unique();
            $table->string('registration_number');
            $table->string('tax_id')->nullable();
            $table->string('bank_account');
            $table->string('bank_name');
            $table->enum('status', ['active', 'inactive', 'suspended', 'pending'])->default('pending');
            $table->decimal('rating', 3, 2)->default(0);
            $table->integer('total_orders')->default(0);
            $table->decimal('on_time_delivery_rate', 5, 2)->default(100);
            $table->string('contact_person');
            $table->string('contact_phone');
            $table->timestamps();

            $table->index('wholesaler_id');
            $table->index('status');
        });

        // Wholesale inventory management
        Schema::create('wholesale_inventory', function (Blueprint $table) {
            $table->id();
            $table->string('wholesaler_id');
            $table->string('drug_id');
            $table->string('drug_name');
            $table->string('batch_number');
            $table->integer('quantity_in_stock');
            $table->integer('minimum_stock_level');
            $table->integer('reorder_quantity');
            $table->decimal('unit_price', 10, 2);
            $table->date('expiry_date');
            $table->date('manufacture_date');
            $table->string('location')->nullable(); // Warehouse location/shelf
            $table->enum('status', ['available', 'low_stock', 'out_of_stock', 'expired'])->default('available');
            $table->timestamps();

            $table->unique(['wholesaler_id', 'drug_id', 'batch_number']);
            $table->index('wholesaler_id');
            $table->index('drug_id');
            $table->index('status');
        });

        // Bulk discounts/tiered pricing
        Schema::create('wholesale_discounts', function (Blueprint $table) {
            $table->id();
            $table->string('wholesaler_id');
            $table->string('drug_id');
            $table->integer('min_quantity');
            $table->integer('max_quantity')->nullable();
            $table->decimal('discount_percentage', 5, 2);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->dateTime('valid_from');
            $table->dateTime('valid_until')->nullable();
            $table->timestamps();

            $table->index('wholesaler_id');
            $table->index('drug_id');
        });

        // Wholesaler order history/analytics
        Schema::create('wholesale_order_analytics', function (Blueprint $table) {
            $table->id();
            $table->string('wholesaler_id');
            $table->string('pharmacy_id');
            $table->integer('total_orders_received');
            $table->integer('completed_orders');
            $table->integer('cancelled_orders');
            $table->decimal('total_revenue', 15, 2);
            $table->decimal('average_order_value', 12, 2);
            $table->integer('avg_delivery_days');
            $table->decimal('customer_satisfaction_rating', 3, 2);
            $table->timestamps();

            $table->unique(['wholesaler_id', 'pharmacy_id']);
            $table->index('wholesaler_id');
        });

        // Minimum order quantities per wholesaler
        Schema::create('wholesale_min_orders', function (Blueprint $table) {
            $table->id();
            $table->string('wholesaler_id');
            $table->string('drug_id');
            $table->integer('minimum_order_quantity');
            $table->text('notes')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->unique(['wholesaler_id', 'drug_id']);
            $table->index('wholesaler_id');
        });

        // Delivery terms for wholesalers
        Schema::create('wholesale_delivery_terms', function (Blueprint $table) {
            $table->id();
            $table->string('wholesaler_id');
            $table->string('delivery_type'); // standard, express, scheduled
            $table->integer('days_to_delivery');
            $table->decimal('delivery_fee', 10, 2);
            $table->integer('minimum_order_amount')->nullable();
            $table->string('service_area')->nullable(); // e.g., "Within Dar es Salaam"
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->index('wholesaler_id');
        });

        // Wholesale return/refund policy
        Schema::create('wholesale_returns', function (Blueprint $table) {
            $table->id();
            $table->string('order_id');
            $table->string('wholesaler_id');
            $table->string('pharmacy_id');
            $table->foreignId('wholesale_order_id')->constrained('wholesale_orders')->onDelete('cascade');
            $table->json('returned_items'); // Array of {drug_id, quantity, reason}
            $table->decimal('return_amount', 12, 2);
            $table->enum('reason', ['defective', 'expired', 'damaged', 'wrong_item', 'quality_issue', 'other']);
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'refunded'])->default('pending');
            $table->dateTime('request_date');
            $table->dateTime('approval_date')->nullable();
            $table->dateTime('refund_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('wholesaler_id');
            $table->index('status');
        });

        // Credit/payment terms
        Schema::create('wholesale_credit_terms', function (Blueprint $table) {
            $table->id();
            $table->string('wholesaler_id');
            $table->string('pharmacy_id');
            $table->decimal('credit_limit', 15, 2);
            $table->decimal('current_balance', 15, 2)->default(0);
            $table->integer('payment_terms_days')->default(30); // Net 30, Net 60, etc
            $table->enum('status', ['active', 'suspended', 'closed'])->default('active');
            $table->dateTime('last_payment_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['wholesaler_id', 'pharmacy_id']);
            $table->index('wholesaler_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wholesale_credit_terms');
        Schema::dropIfExists('wholesale_returns');
        Schema::dropIfExists('wholesale_delivery_terms');
        Schema::dropIfExists('wholesale_min_orders');
        Schema::dropIfExists('wholesale_order_analytics');
        Schema::dropIfExists('wholesale_discounts');
        Schema::dropIfExists('wholesale_inventory');
        Schema::dropIfExists('wholesalers');
    }
};
