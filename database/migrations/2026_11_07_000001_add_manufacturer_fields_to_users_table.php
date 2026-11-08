<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'manufacturer_name')) {
                $table->string('manufacturer_name')->nullable()->after('role');
            }
            if (! Schema::hasColumn('users', 'manufacturer_license')) {
                $table->string('manufacturer_license')->nullable()->after('manufacturer_name');
            }
            if (! Schema::hasColumn('users', 'manufacturer_address')) {
                $table->string('manufacturer_address')->nullable()->after('manufacturer_license');
            }
            if (! Schema::hasColumn('users', 'manufacturer_phone')) {
                $table->string('manufacturer_phone')->nullable()->after('manufacturer_address');
            }
            if (! Schema::hasColumn('users', 'manufacturer_email')) {
                $table->string('manufacturer_email')->nullable()->after('manufacturer_phone');
            }
            if (! Schema::hasColumn('users', 'manufacturer_website')) {
                $table->string('manufacturer_website')->nullable()->after('manufacturer_email');
            }
            if (! Schema::hasColumn('users', 'manufacturer_logo')) {
                $table->string('manufacturer_logo')->nullable()->after('manufacturer_website');
            }
            if (! Schema::hasColumn('users', 'manufacturer_description')) {
                $table->text('manufacturer_description')->nullable()->after('manufacturer_logo');
            }
        });

        // The role column is an ENUM on MySQL/MariaDB. Widen it so a
        // manufacturer account is a first-class role, not an owner with extra
        // branding attached.
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','owner','pharmacist','cashier','delivery','customer','manufacturer') NOT NULL DEFAULT 'owner'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','owner','pharmacist','cashier','delivery','customer') NOT NULL DEFAULT 'owner'");
        }

        Schema::table('users', function (Blueprint $table) {
            $columns = [
                'manufacturer_name',
                'manufacturer_license',
                'manufacturer_address',
                'manufacturer_phone',
                'manufacturer_email',
                'manufacturer_website',
                'manufacturer_logo',
                'manufacturer_description',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
