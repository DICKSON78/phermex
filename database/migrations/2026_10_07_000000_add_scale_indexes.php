<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Scale indexes for the customer-facing hot paths (50M+ users / pharmacies):
 * - geo + publication filters for nearby pharmacy discovery
 * - login lookups
 * - per-user listing queries (orders, notifications, prescriptions, tickets)
 * - FULLTEXT so pharmacy/drug search never degrades into hard full scans.
 *
 * All ALTERs here are online DDL in MySQL 8 (INPLACE), so they can be run
 * while the site stays up. Run with `php artisan migrate`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pharmacies', function (Blueprint $table) {
            $this->addIndex($table, 'pharmacies_scope_idx', ['status', 'is_published']);
            $this->addIndex($table, 'pharmacies_geo_idx', ['latitude', 'longitude']);
            $this->addFullText($table, 'pharmacies_search', ['pharmacy_name', 'region', 'district', 'ward']);
        });

        Schema::table('drugs', function (Blueprint $table) {
            $this->addIndex($table, 'drugs_catalog_idx', ['pharmacy_id', 'is_published', 'name']);
            $this->addIndex($table, 'drugs_barcode_idx', ['barcode', 'is_published']);
            $this->addFullText($table, 'drugs_search', ['name', 'generic_name', 'manufacturer', 'barcode']);
        });

        Schema::table('users', function (Blueprint $table) {
            $this->addIndex($table, 'users_role_active_idx', ['role', 'is_active']);
            $this->addIndex($table, 'users_login_email_idx', ['role', 'email']);
            $this->addIndex($table, 'users_login_phone_idx', ['role', 'phone']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $this->addIndex($table, 'orders_user_created_idx', ['user_id', 'created_at']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $this->addIndex($table, 'notifications_user_created_idx', ['user_id', 'created_at']);
        });

        Schema::table('prescriptions', function (Blueprint $table) {
            $this->addIndex($table, 'prescriptions_user_created_idx', ['user_id', 'created_at']);
        });

        Schema::table('support_tickets', function (Blueprint $table) {
            $this->addIndex($table, 'support_tickets_user_created_idx', ['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('pharmacies', function (Blueprint $table) {
            $this->dropIndex($table, 'pharmacies_scope_idx');
            $this->dropIndex($table, 'pharmacies_geo_idx');
            $this->dropFullText($table, 'pharmacies_search');
        });

        Schema::table('drugs', function (Blueprint $table) {
            $this->dropIndex($table, 'drugs_catalog_idx');
            $this->dropIndex($table, 'drugs_barcode_idx');
            $this->dropFullText($table, 'drugs_search');
        });

        Schema::table('users', function (Blueprint $table) {
            $this->dropIndex($table, 'users_role_active_idx');
            $this->dropIndex($table, 'users_login_email_idx');
            $this->dropIndex($table, 'users_login_phone_idx');
        });

        Schema::table('orders', function (Blueprint $table) {
            $this->dropIndex($table, 'orders_user_created_idx');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $this->dropIndex($table, 'notifications_user_created_idx');
        });

        Schema::table('prescriptions', function (Blueprint $table) {
            $this->dropIndex($table, 'prescriptions_user_created_idx');
        });

        Schema::table('support_tickets', function (Blueprint $table) {
            $this->dropIndex($table, 'support_tickets_user_created_idx');
        });
    }

    private function addIndex(Blueprint $table, string $name, array $columns): void
    {
        try {
            $table->index($columns, $name);
        } catch (Throwable $e) {
            // Already exists (e.g. from a previous run / foreign key)
        }
    }

    private function dropIndex(Blueprint $table, string $name): void
    {
        try {
            $table->dropIndex($name);
        } catch (Throwable $e) {
            // Nothing to drop
        }
    }

    private function addFullText(Blueprint $table, string $name, array $columns): void
    {
        try {
            $table->fullText($columns, $name);
        } catch (Throwable $e) {
            // Full-text index already present
        }
    }

    private function dropFullText(Blueprint $table, string $name): void
    {
        try {
            $table->dropIndex($name);
        } catch (Throwable $e) {
            // Nothing to drop
        }
    }
};
