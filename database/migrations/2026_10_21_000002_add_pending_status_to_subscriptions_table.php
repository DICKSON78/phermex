<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A package that was chosen is not a package that is paid for. The row
        // used to say "active" from the moment the owner picked a plan, which
        // made unpaid packages look like paying customers on the books. The
        // "pending" state says what is true: the plan has been chosen and the
        // money has not arrived yet.
        if (Schema::hasTable('subscriptions')) {
            DB::statement(
                "ALTER TABLE subscriptions MODIFY status ENUM('trial','pending','active','expired','suspended','cancelled') NOT NULL DEFAULT 'pending'"
            );
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('subscriptions')) {
            return;
        }

        // The old enum has no room for a package that is chosen but unpaid.
        DB::table('subscriptions')->where('status', 'pending')->update(['status' => 'cancelled']);

        DB::statement(
            "ALTER TABLE subscriptions MODIFY status ENUM('active','expired','suspended','cancelled') NOT NULL DEFAULT 'active'"
        );
    }
};
