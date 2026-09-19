<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_posts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->enum('type', ['banner', 'announcement', 'promotion', 'blog']);
            $table->text('content');
            $table->string('image_url')->nullable();
            $table->enum('status', ['active', 'draft', 'archived'])->default('draft');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->json('metadata')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('type');
            $table->index('status');
            $table->index(['status', 'starts_at', 'ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_posts');
    }
};
