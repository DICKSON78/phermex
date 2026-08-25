<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['email', 'sms', 'push', 'in-app'])->default('email');
            $table->string('audience')->default('All Owners');
            $table->enum('status', ['draft', 'active', 'paused', 'completed'])->default('draft');
            $table->date('start_date');
            $table->date('end_date');
            $table->text('description')->nullable();
            $table->unsignedInteger('impressions')->default(0);
            $table->unsignedInteger('clicks')->default(0);
            $table->unsignedInteger('conversions')->default(0);
            $table->decimal('spend', 12, 2)->default(0);
            $table->timestamps();

            $table->index('status');
            $table->index(['start_date', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_campaigns');
    }
};
