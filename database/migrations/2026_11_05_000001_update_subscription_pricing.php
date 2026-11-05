<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update pricing: Display as monthly without "/year" suffix
        // STARTER: 14.99/month
        // PROFESSIONAL: 19.99/month
        // ENTERPRISE: 29.99/month
        
        DB::table('subscription_plans')->where('slug', 'starter')->update([
            'price' => 14.99,
            'name' => 'STARTER',
            'duration_months' => 1, // Changed to monthly
        ]);

        DB::table('subscription_plans')->where('slug', 'professional')->update([
            'price' => 19.99,
            'name' => 'PROFESSIONAL',
            'duration_months' => 1, // Changed to monthly
        ]);

        DB::table('subscription_plans')->where('slug', 'enterprise')->update([
            'price' => 29.99,
            'name' => 'ENTERPRISE',
            'duration_months' => 1, // Changed to monthly
        ]);
    }

    public function down(): void
    {
        // Revert to original pricing if rollback needed
        DB::table('subscription_plans')->where('slug', 'starter')->update([
            'price' => 150.00,
            'duration_months' => 12,
        ]);

        DB::table('subscription_plans')->where('slug', 'professional')->update([
            'price' => 200.00,
            'duration_months' => 12,
        ]);

        DB::table('subscription_plans')->where('slug', 'enterprise')->update([
            'price' => 250.00,
            'duration_months' => 12,
        ]);
    }
};
