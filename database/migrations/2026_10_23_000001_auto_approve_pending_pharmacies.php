<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Approval used to be a manual admin step, so any account that signed
        // up before this change is still parked on "pending". Put those rows
        // on the same footing as new registrations: active, approved and on a
        // 30 day trial (only rows without a trial date get a fresh one).
        if (! Schema::hasTable('pharmacies')) {
            return;
        }

        DB::table('pharmacies')
            ->where('application_status', 'pending')
            ->whereNull('trial_ends_at')
            ->update(['trial_ends_at' => now()->addDays(30)]);

        DB::table('pharmacies')
            ->where('application_status', 'pending')
            ->update([
                'application_status' => 'approved',
                'status' => 'active',
            ]);
    }

    public function down(): void
    {
        // No-op: once an owner has used the trial there is no reliable way to
        // say which rows were pending before, and re-parking them would lock
        // live accounts out.
    }
};
