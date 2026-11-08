<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Trade promotions that a manufacturer runs across pharmacy partners.
        Schema::create('manufacturer_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('manufacturer_products')->nullOnDelete();
            $table->string('name');
            $table->enum('channel', ['in_app', 'email', 'sms', 'social', 'trade', 'field'])->default('in_app');
            $table->enum('status', ['draft', 'scheduled', 'active', 'paused', 'completed'])->default('draft');
            $table->string('target_audience')->nullable();
            $table->text('description')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->decimal('budget', 12, 2)->default(0);
            $table->decimal('spend', 12, 2)->default(0);
            $table->unsignedInteger('impressions')->default(0);
            $table->unsignedInteger('clicks')->default(0);
            $table->unsignedInteger('conversions')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'channel']);
        });

        // Connections the manufacturer has configured against their account.
        Schema::create('manufacturer_integrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('provider');
            $table->string('name');
            $table->enum('type', ['api', 'webhook', 'erp', 'crm', 'analytics', 'payment'])->default('api');
            $table->string('endpoint')->nullable();
            $table->string('api_key')->nullable();
            $table->enum('status', ['connected', 'disconnected', 'error'])->default('disconnected');
            $table->text('description')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'provider']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manufacturer_integrations');
        Schema::dropIfExists('manufacturer_campaigns');
    }
};
