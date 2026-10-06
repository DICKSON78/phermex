<?php

/**
 * End-to-end check of the subscription payment path.
 *
 * Driven through the real HTTP kernel so routing, middleware and the controller
 * all take part, and against the live gateway for the preview and the status
 * query. Only the initiate call is faked, because a real push lands on somebody's
 * phone.
 *
 * Run it with:
 *   bash tests/Feature/run_subscription_payment_e2e.sh
 *
 * The assertions live in a plain script rather than PHPUnit because this
 * repository has no phpunit.xml, so `php artisan test` cannot run at all.
 */

putenv('CACHE_STORE=array');

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

$app = require $root . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Services\ClickPesaChecksum;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

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

function line(string $label, $value): void
{
    printf("  %-32s %s\n", $label . ':', (string) $value);
}

$pass = 0;
$fail = 0;

function check(string $name, bool $ok, string $detail = ''): void
{
    global $pass, $fail;

    $ok ? $pass++ : $fail++;

    printf("  [%s] %s%s\n", $ok ? 'PASS' : 'FAIL', $name, $detail === '' ? '' : ' -> ' . $detail);
}

function lastLogMatching(string $needle): string
{
    global $root;

    $found = '';

    foreach (explode("\n", (string) @file_get_contents($root . '/storage/logs/laravel.log')) as $l) {
        if (str_contains($l, $needle)) {
            $found = $l;
        }
    }

    return $found;
}

// A real push would land on somebody's phone, so only the initiate call is
// faked. The preview and the status query go to the live gateway, which is
// where the behaviour worth checking lives.
Http::fake(function ($request) {
    if (str_contains($request->url(), 'initiate-ussd-push-request')) {
        return Http::response([
            'status' => 'PROCESSING',
            'channel' => 'TIGO-PESA',
            'orderReference' => 'FAKE123',
            'message' => 'Request sent to customer device',
        ], 200);
    }

    return null;
});

echo "\n== setup ==\n";

$user = User::where('email', 'owner@pharmex.com')->first();
$token = $user->createToken('e2e')->plainTextToken;
$plan = DB::table('subscription_plans')->where('slug', 'starter')->first();

line('owner', $user->email);
line('plan', $plan->name . ' USD ' . $plan->price);
line('clickpesa enabled', var_export(config('services.clickpesa.enabled'), true));

$secret = 'test-key';
config(['services.clickpesa.webhook_secret' => $secret]);

echo "\n== 1. Vodacom number is held back with coming soon ==\n";

$r = call('POST', '/api/subscriptions/checkout', ['plan_id' => $plan->id, 'phone' => '0754123456', 'payment_method' => 'mobile'], $token);

line('status', $r['status']);
line('message', (string) ($r['body']['message'] ?? ''));
check('returns 422', $r['status'] === 422);
check('flags coming_soon', ($r['body']['coming_soon'] ?? false) === true);
check('names networks that work', !empty($r['body']['supported_channels']));
check('no invoice left behind', DB::table('revenue_records')->where('pharmacy_id', 1)->where('status', 'pending')->count() === 0);

echo "\n== 2. Tigo number reaches the gateway ==\n";

$r = call('POST', '/api/subscriptions/checkout', ['plan_id' => $plan->id, 'phone' => '0678123456', 'payment_method' => 'mobile'], $token);

line('status', $r['status']);
line('push_initiated', var_export($r['body']['push_initiated'] ?? false, true));
line('gateway_channel', (string) ($r['body']['gateway_channel'] ?? '-'));
line('supported_channels', implode(',', $r['body']['supported_channels'] ?? []));
line('amount charged TZS', (string) ($r['body']['subscription']['amount_tzs'] ?? '-'));
line('push_error', (string) ($r['body']['push_error'] ?? 'none'));

check('checkout accepted', $r['status'] === 200);
check('push initiated', ($r['body']['push_initiated'] ?? false) === true);
check('gateway matched TIGO-PESA', ($r['body']['gateway_channel'] ?? '') === 'TIGO-PESA');
check('three networks offered', count($r['body']['supported_channels'] ?? []) === 3);
check('no error reported', empty($r['body']['push_error']));
check('invoice written', DB::table('revenue_records')->where('payment_reference', 'FAKE123')->exists());

echo "\n== 3. webhook asks the gateway about a real payment ==\n";

// A reference ClickPesa really knows, so the gateway can give a real answer.
$knownRef = 'HELIXTEST15NRG';
DB::table('revenue_records')->insert([
    'pharmacy_id' => 1, 'pharmacy_name' => 'Test', 'type' => 'subscription',
    'amount' => 394779, 'invoice_number' => 'E2E-TEST-001', 'due_date' => now()->addDays(30),
    'payment_reference' => $knownRef, 'status' => 'pending',
    'payment_method' => 'mobile', 'created_at' => now(), 'updated_at' => now(),
]);

$payload = [
    'event' => 'PAYMENT RECEIVED',
    'data' => ['status' => 'SUCCESS', 'orderReference' => $knownRef, 'collectedAmount' => '394779', 'channel' => 'TIGO-PESA'],
];
$payload['checksum'] = ClickPesaChecksum::create($secret, $payload);

$r = call('POST', '/api/payments/webhook', $payload);

line('status', $r['status']);
check('acknowledged with 2xx', $r['status'] >= 200 && $r['status'] < 300);

$confirm = lastLogMatching('gateway confirmation');
check('gateway was asked', str_contains($confirm, $knownRef), $confirm === '' ? 'nothing logged' : 'answered');
check('answer recorded', str_contains($confirm, '"confirmed":false') || str_contains($confirm, 'confirmed\\":false'));
check('invoice left pending', DB::table('revenue_records')->where('payment_reference', $knownRef)->value('status') === 'pending');
line('gateway said', (string) ($confirm === '' ? 'nothing' : substr($confirm, strpos($confirm, 'gateway_status') ?: 0, 60)));

echo "\n== 4. a reference the gateway has never seen stops retrying ==\n";

$unknown = ['event' => 'PAYMENT RECEIVED', 'data' => ['status' => 'SUCCESS', 'orderReference' => 'NOSUCHREF42']];
$unknown['checksum'] = ClickPesaChecksum::create($secret, $unknown);

$r = call('POST', '/api/payments/webhook', $unknown);

line('status', $r['status']);
line('body', json_encode($r['body']));
check('acknowledged so it stops calling', $r['status'] === 200);

echo "\n== 5. forged callback claiming success grants nothing ==\n";

$forged = ['event' => 'PAYMENT RECEIVED', 'data' => ['status' => 'SUCCESS', 'orderReference' => 'FAKE123']];
$forged['checksum'] = ClickPesaChecksum::create($secret, $forged);

$r = call('POST', '/api/payments/webhook', $forged);

line('status', $r['status']);
check('acknowledged', $r['status'] >= 200 && $r['status'] < 300);
check('faked reference still pending', DB::table('revenue_records')->where('payment_reference', 'FAKE123')->value('status') === 'pending');
check('no success from payload alone', str_contains(lastLogMatching('gateway confirmation'), 'false'));

echo "\n== 6. tampered payload cannot activate anything ==\n";

$tampered = ['event' => 'PAYMENT RECEIVED', 'data' => ['status' => 'SUCCESS', 'orderReference' => $knownRef]];
$tampered['checksum'] = ClickPesaChecksum::create($secret, $tampered);
$tampered['data']['status'] = 'FAILED'; // changed after signing

$r = call('POST', '/api/payments/webhook', $tampered);

line('status', $r['status']);
check('mismatch logged', str_contains(lastLogMatching('checksum did not match'), 'ClickPesa webhook checksum did not match'));
check('still gated by the gateway, not the payload', DB::table('revenue_records')->where('payment_reference', $knownRef)->value('status') === 'pending');
check('invoice untouched', DB::table('revenue_records')->where('payment_reference', $knownRef)->value('status') === 'pending');

echo "\n== 7. plans and prices ==\n";

$r = call('GET', '/api/subscriptions/plans');

line('status', $r['status']);
check('three plans served', count($r['body']['data'] ?? []) === 3);
line('starter', (string) ($r['body']['data'][0]['price'] ?? '-') . ' ' . ($r['body']['data'][0]['currency'] ?? ''));

echo "\n== 8. M-PESA only ever appears as coming soon ==\n";

$src = file_get_contents($root . '/dashboard/src/pages/auth/SubscriptionPlansPage.jsx');

check('no M-PESA PIN prompt', !str_contains($src, 'M-PESA PIN'));
check('no confirm-M-PESA prompt', !str_contains($src, 'Confirm the M-PESA'));
check('coming soon is present', str_contains($src, 'not available yet'));

echo "\n---------------------------------------------\n";
printf("  passed: %d   failed: %d\n\n", $pass, $fail);

exit($fail === 0 ? 0 : 1);
