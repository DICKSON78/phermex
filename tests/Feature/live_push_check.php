<?php

/**
 * Second live attempt: push a real USSD-PUSH and follow it all the way through
 * settlement via the app's own status endpoint.
 *
 * Nothing faked. Approve the prompt on the handset as soon as it lands, the
 * gateway only holds a request open for about five minutes.
 *
 * Usage: DB_CONNECTION=sqlite DB_DATABASE=/tmp/pharmex_live.sqlite \
 *        php tests/Feature/live_push_check.php <phone>
 */

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

$app = require $root . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

$phone = $argv[1] ?? '0678960706';

function call(string $method, string $uri, array $data = [], ?string $token = null): array
{
    global $kernel;

    $server = ['HTTP_ACCEPT' => 'application/json', 'CONTENT_TYPE' => 'application/json'];

    if ($token) {
        $server['HTTP_AUTHORIZATION'] = 'Bearer ' . $token;
    }

    $request = Request::create($uri, $method, [], [], [], $server, $data === [] ? null : json_encode($data));
    $response = $kernel->handle($request);

    return ['status' => $response->getStatusCode(), 'body' => json_decode($response->getContent(), true) ?? $response->getContent()];
}

echo "\n=== LIVE ATTEMPT 2 -> " . $phone . " ===\n";

$user = User::where('email', 'owner@pharmex.com')->first();
$token = $user->createToken('live2')->plainTextToken;
$plan = DB::table('subscription_plans')->where('slug', 'starter')->first();

DB::table('revenue_records')->where('pharmacy_id', 1)->delete();

echo "sending push for TZS " . round((float) $plan->price * app(App\Services\ExchangeRateService::class)->tzsPerUsd()) . " ...\n";

$r = call('POST', '/api/subscriptions/checkout', ['plan_id' => $plan->id, 'phone' => $phone, 'payment_method' => 'mobile'], $token);

$reference = $r['body']['reference'] ?? null;

echo "http           : " . $r['status'] . "\n";
echo "channel        : " . ($r['body']['gateway_channel'] ?? '-') . "\n";
echo "gateway status : " . ($r['body']['gateway_status'] ?? '-') . "\n";
echo "reference      : " . ($reference ?: '-') . "\n";
echo "push_error     : " . ($r['body']['push_error'] ?? 'none') . "\n\n";

if (! $reference) {
    echo "  push did not leave. nothing charged.\n\n";
    exit(1);
}

echo "  >>> APPROVE THE PROMPT ON YOUR PHONE NOW <<<\n";
echo "  >>> watching for 300 seconds <<<\n\n";

$seen = [];
$settled = false;

for ($i = 1; $i <= 60; $i++) {
    $s = call('GET', '/api/subscriptions/payment-status?reference=' . urlencode($reference), [], $token);

    $gateway = $s['body']['gateway_status'] ?? '?';
    $state = $s['body']['status'] ?? '?';

    if (! in_array($gateway, $seen, true)) {
        $seen[] = $gateway;
        printf("  [%3ds] gateway=%-11s invoice=%s\n", $i * 5, $gateway, $state);
    }

    if ($s['body']['paid'] ?? false) {
        $settled = true;
        printf("  [%3ds] gateway=%-11s invoice=%s  <<< PAID\n", $i * 5, $gateway, $state);
        break;
    }

    if (in_array($gateway, ['FAILED', 'EXPIRED', 'CANCELLED', 'REVERSED'], true)) {
        printf("  [%3ds] gateway=%-11s invoice=%s  <<< declined\n", $i * 5, $gateway, $state);
        break;
    }

    sleep(5);
}

echo "\n--- gateway, directly ---\n";

$direct = app(App\Services\ClickPesaService::class)->queryStatus($reference);

printf("  status   : %s\n  channel  : %s\n  message  : %s\n  collected: %s %s\n",
    $direct['status'] ?? '-', $direct['channel'] ?? '-', $direct['message'] ?? '-',
    $direct['collectedAmount'] ?? '-', $direct['collectedCurrency'] ?? '');

echo "\n--- what the app wrote ---\n";

$invoice = DB::table('revenue_records')->where('payment_reference', $reference)->first();
echo "invoice        : " . ($invoice->status ?? 'missing') . "\n";
echo "paid_at        : " . ($invoice->paid_at ?? '-') . "\n";

$subscription = DB::table('subscriptions')->where('pharmacy_id', 1)->latest('id')->first();
echo "subscription   : " . ($subscription->plan ?? '-') . " / " . ($subscription->status ?? '-') . "\n";
echo "transaction_id : " . ($subscription->transaction_id ?: '-') . "\n";

$pharmacy = DB::table('pharmacies')->where('id', 1)->first();
echo "pharmacy       : status=" . $pharmacy->status . " payment=" . $pharmacy->payment_status . "\n";

echo "\n--- notifications raised ---\n";

foreach (DB::table('notifications')->where('pharmacy_id', 1)->latest('id')->limit(3)->get() as $n) {
    echo '  ' . $n->title . ' -- ' . substr((string) $n->message, 0, 90) . "\n";
}

echo "\n=== " . ($settled ? 'SETTLED' : 'NOT SETTLED') . " ===\n\n";
