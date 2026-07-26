<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pharmacies', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('street');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->text('description')->nullable()->after('email');
            $table->string('cover_image')->nullable()->after('pharmacy_logo');
            $table->decimal('rating', 3, 2)->default(0)->after('monthly_revenue');
            $table->unsignedInteger('total_reviews')->default(0)->after('rating');
            $table->unsignedInteger('average_prep_time')->default(15)->comment('Minutes')->after('total_reviews');
        });
    }

    public function down(): void
    {
        Schema::table('pharmacies', function (Blueprint $table) {
            $table->dropColumn([
                'latitude', 'longitude', 'description',
                'cover_image', 'rating', 'total_reviews', 'average_prep_time',
            ]);
        });
    }
};
