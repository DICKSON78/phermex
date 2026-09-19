<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pharmacy_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('receiver_id')->constrained('users')->cascadeOnDelete();
            $table->text('message');
            $table->enum('message_type', ['text', 'order_inquiry', 'prescription_inquiry', 'emergency'])->default('text');
            $table->boolean('is_read')->default(false);
            $table->timestamps();
            $table->index(['pharmacy_id', 'sender_id', 'receiver_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
