<?php
/**
 * Direct pricing fix script
 * Place in project root and run: php fix_pricing.php
 */

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Updating Subscription Pricing ===\n\n";

// Update each plan - EXACTLY with .99
$updates = [
    'starter' => ['price' => 14.99, 'duration_months' => 1],
    'professional' => ['price' => 19.99, 'duration_months' => 1],
    'enterprise' => ['price' => 29.99, 'duration_months' => 1],
];

foreach ($updates as $slug => $data) {
    $result = DB::table('subscription_plans')
        ->where('slug', $slug)
        ->update($data);
    
    if ($result) {
        echo "✓ Updated $slug: \${$data['price']}/month\n";
    }
}

echo "\n=== Current Prices ===\n";
$plans = DB::table('subscription_plans')
    ->select('name', 'price', 'duration_months')
    ->get();

foreach ($plans as $plan) {
    echo "{$plan->name}: \${$plan->price}/month (duration: {$plan->duration_months})\n";
}

echo "\n=== Clearing Cache ===\n";
exec('php artisan cache:clear');
echo "✓ Cache cleared\n";

echo "\n✅ Complete!\n";
