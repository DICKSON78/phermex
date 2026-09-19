<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $indexes = [
            'drugs' => ['pharmacy_id'],
            'customers' => ['pharmacy_id'],
            'orders' => ['pharmacy_id'],
            'prescriptions' => ['pharmacy_id'],
            'drug_movements' => ['pharmacy_id', 'drug_id'],
            'expenses' => ['pharmacy_id'],
            'deliveries' => ['pharmacy_id', 'order_id'],
            'order_items' => ['drug_id', 'order_id'],
            'prescription_items' => ['drug_id', 'prescription_id'],
        ];

        foreach ($indexes as $table => $columns) {
            foreach ($columns as $column) {
                try {
                    Schema::table($table, function (Blueprint $table) use ($column) {
                        $table->index($column);
                    });
                } catch (\Exception $e) {
                    // Index already exists (e.g. from foreign key), skip
                }
            }
        }
    }

    public function down(): void
    {
        Schema::table('drugs', function (Blueprint $table) {
            $table->dropIndex(['pharmacy_id']);
        });
        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex(['pharmacy_id']);
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['pharmacy_id']);
        });
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropIndex(['pharmacy_id']);
        });
        Schema::table('drug_movements', function (Blueprint $table) {
            $table->dropIndex(['pharmacy_id']);
            $table->dropIndex(['drug_id']);
        });
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropIndex(['pharmacy_id']);
        });
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropIndex(['pharmacy_id']);
            $table->dropIndex(['order_id']);
        });
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex(['drug_id']);
            $table->dropIndex(['order_id']);
        });
        Schema::table('prescription_items', function (Blueprint $table) {
            $table->dropIndex(['drug_id']);
            $table->dropIndex(['prescription_id']);
        });
    }
};
