<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pharmacies', function (Blueprint $table) {
            $table->unsignedSmallInteger('slot_minutes')->default(20)->after('working_days');
            $table->unsignedSmallInteger('slot_gap_minutes')->default(10)->after('slot_minutes');
        });

        Schema::table('telemedicine_sessions', function (Blueprint $table) {
            $table->text('pharmacist_notes')->nullable()->after('patient_notes');
        });
    }

    public function down(): void
    {
        Schema::table('pharmacies', function (Blueprint $table) {
            $table->dropColumn(['slot_minutes', 'slot_gap_minutes']);
        });

        Schema::table('telemedicine_sessions', function (Blueprint $table) {
            $table->dropColumn(['pharmacist_notes']);
        });
    }
};