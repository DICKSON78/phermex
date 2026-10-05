<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pharmacies', function (Blueprint $table) {
            // How the pharmacy wants to be paid by customers, decided by the
            // pharmacy. Order money is never routed through the platform.
            $table->string('customer_payment_method', 20)->default('cash');

            // The account number customers pay directly: Lipa Namba, Mixx by
            // Yas, Wave, or a bank account, depending on the method.
            $table->string('customer_payment_number', 40)->nullable();

            // Name registered to that number, shown to the customer so they can
            // check they are paying the right account.
            $table->string('customer_payment_name', 120)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('pharmacies', function (Blueprint $table) {
            $table->dropColumn([
                'customer_payment_method',
                'customer_payment_number',
                'customer_payment_name',
            ]);
        });
    }
};