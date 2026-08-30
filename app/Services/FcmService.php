<?php

namespace App\Services;

use App\Models\DeviceToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmService
{
    public function sendToUser(int $userId, string $title, string $body, array $data = []): void
    {
        $serverKey = config('services.fcm.server_key', '');
        if ($serverKey === '') {
            return;
        }

        $tokens = DeviceToken::where('user_id', $userId)->pluck('device_token')->unique();

        if ($tokens->isEmpty()) {
            return;
        }

        try {
            $http = Http::withToken($serverKey)
                ->timeout(15);

            foreach ($tokens as $token) {
                $http->post('https://fcm.googleapis.com/fcm/send', [
                    'to' => $token,
                    'notification' => [
                        'title' => $title,
                        'body' => $body,
                    ],
                    'data' => $data,
                    'priority' => 'high',
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('FCM send failed: ' . $e->getMessage());
        }
    }

    public function sendToOrderTotal(array $tokens, string $title, string $body, array $data = []): void
    {
        $serverKey = config('services.fcm.server_key', '');
        if ($serverKey === '' || empty($tokens)) {
            return;
        }

        try {
            Http::withToken($serverKey)
                ->timeout(15)
                ->post('https://fcm.googleapis.com/fcm/send', [
                    'to' => '/topics/helix_all',
                    'notification' => ['title' => $title, 'body' => $body],
                    'data' => $data,
                    'priority' => 'high',
                ]);
        } catch (\Throwable $e) {
            Log::warning('FCM broadcast failed: ' . $e->getMessage());
        }
    }
}
