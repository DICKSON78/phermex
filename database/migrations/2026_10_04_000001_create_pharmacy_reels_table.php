<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pharmacy_reels', function (Blueprint $table) {
            $table->id();

            // One reel per pharmacy — the unique index is the enforcement point,
            // so concurrent requests can never slip a second reel through.
            $table->foreignId('pharmacy_id')->unique()->constrained('pharmacies')->cascadeOnDelete();

            $table->string('title')->max(150);
            $table->text('description')->nullable();

            // image | video
            $table->string('media_type', 10)->default('image');
            $table->string('media_url');
            $table->string('thumbnail_url')->nullable();

            // draft | published
            $table->string('status', 10)->default('published');
            $table->unsignedInteger('views')->default(0);

            $table->timestamps();

            $table->index(['status', 'updated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pharmacy_reels');
    }
};
