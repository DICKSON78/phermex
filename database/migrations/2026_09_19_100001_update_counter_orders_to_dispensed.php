<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('orders')
            ->where('order_type', 'counter')
            ->where('order_status', 'pending')
            ->update(['order_status' => 'dispensed']);
    }

    public function down(): void
    {
    }
};