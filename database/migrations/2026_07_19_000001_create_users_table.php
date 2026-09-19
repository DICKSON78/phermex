<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('photo')->nullable();
            $table->enum('role', ['admin', 'owner', 'pharmacist', 'cashier', 'delivery', 'customer'])->default('owner');
            $table->string('location')->nullable();
            $table->string('street')->nullable();
            $table->string('road')->nullable();
            $table->string('user_code', 20)->unique()->comment('Generated like PHX-XXXXXX');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_verified')->default(false);
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
