<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('telemedicine_sessions', function (Blueprint $table) {
            $table->dateTime('scheduled_at')->nullable()->after('status');
            $table->string('topic', 120)->nullable()->after('scheduled_at');
            $table->text('patient_notes')->nullable()->after('topic');
            $table->softDeletes()->after('ended_at');
        });
    }

    public function down(): void
    {
        Schema::table('telemedicine_sessions', function (Blueprint $table) {
            $table->dropColumns(['scheduled_at', 'topic', 'patient_notes', 'deleted_at']);
        });
    }
};