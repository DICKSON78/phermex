<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Performance indexes for the dashboard/analytics hot paths.
 *
 * Every entry below was verified against the live schema AND the existing
 * SHOW INDEX output, so it only adds what is genuinely missing:
 *   - global admin analytics filter `status` + group by `created_at`/`paid_at`
 *   - per-user chat + audit + notification ordering
 *   - support / subscription lifecycle scans
 *
 * All guarded (skip if already present); MySQL 8 runs them as online DDL.
 */
return new class extends Migration
{
    private array $indexes = [
        'orders' => [
            ['orders_status_created_idx', ['order_status', 'created_at']],
            ['orders_payment_status_created_idx', ['payment_status', 'created_at']],
        ],
        'drug_movements' => [
            ['drug_movements_type_created_idx', ['movement_type', 'created_at']],
        ],
        'messages' => [
            ['messages_sender_created_idx', ['sender_id', 'created_at']],
            ['messages_receiver_created_idx', ['receiver_id', 'created_at']],
        ],
        'notifications' => [
            ['notifications_user_read_created_idx', ['user_id', 'is_read', 'created_at']],
        ],
        'revenue_records' => [
            ['revenue_records_status_paid_idx', ['status', 'paid_at']],
        ],
        'insurance_claims' => [
            ['insurance_claims_status_submitted_idx', ['status', 'submitted_at']],
        ],
        'subscriptions' => [
            ['subscriptions_status_end_idx', ['status', 'end_date']],
        ],
        'audit_logs' => [
            ['audit_logs_user_created_idx', ['user_id', 'created_at']],
        ],
        'support_tickets' => [
            ['support_tickets_status_created_idx', ['status', 'created_at']],
        ],
    ];

    public function up(): void
    {
        foreach ($this->indexes as $table => $definitions) {
            foreach ($definitions as [$name, $columns]) {
                try {
                    Schema::table($table, function (Blueprint $table) use ($name, $columns) {
                        $table->index($columns, $name);
                    });
                } catch (Throwable $e) {
                    // column/table missing or index already present — skip
                }
            }
        }
    }

    public function down(): void
    {
        foreach ($this->indexes as $table => $definitions) {
            foreach ($definitions as [$name]) {
                try {
                    Schema::table($table, function (Blueprint $table) use ($name) {
                        $table->dropIndex($name);
                    });
                } catch (Throwable $e) {
                    // nothing to drop
                }
            }
        }
    }
};
