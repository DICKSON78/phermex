<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSettingController extends Controller
{
    private function getDefaults(): array
    {
        return [
            'platform' => [
                'name' => 'Pharmex',
                'tagline' => 'Smart Pharmacy Management',
                'logo' => null,
                'favicon' => null,
                'contact_email' => 'admin@pharmex.com',
                'contact_phone' => '+234-800-000-0000',
                'website' => 'https://pharmex.com',
                'support_email' => 'support@pharmex.com',
                'address' => '',
                'currency' => 'TZS',
                'timezone' => 'Africa/Dar_es_Salaam',
                'default_language' => 'en',
            ],
            'notifications' => [
                'email_notifications' => true,
                'sms_notifications' => false,
                'push_notifications' => true,
                'low_stock_alerts' => true,
                'expiry_alerts' => true,
                'new_order_alerts' => true,
                'subscription_expiry_reminder' => true,
                'reminder_days_before_expiry' => 7,
            ],
            'retention' => [
                'audit_log_retention_days' => 365,
                'order_history_retention_days' => 730,
                'notification_retention_days' => 90,
                'auto_delete_expired_data' => false,
                'backup_frequency' => 'daily',
            ],
        ];
    }

    private function allSettings(): array
    {
        $defaults = $this->getDefaults();
        $stored = Setting::pluck('value', 'key')->toArray();

        foreach ($stored as $key => $value) {
            $parts = explode('.', $key, 2);
            $group = $parts[0];
            $field = $parts[1] ?? null;

            if ($field && isset($defaults[$group])) {
                $defaults[$group][$field] = $value;
            } elseif (isset($defaults[$group])) {
                $defaults[$group] = $value;
            }
        }

        return $defaults;
    }

    private function saveGroup(string $group, array $values): void
    {
        foreach ($values as $field => $value) {
            Setting::updateOrCreate(
                ['key' => $group . '.' . $field],
                ['value' => $value]
            );
        }
    }

    public function index(Request $request): JsonResponse
    {
        try {
            return response()->json(['data' => $this->allSettings()]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch settings.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function updatePlatform(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'tagline' => 'sometimes|string|max:500',
                'logo' => 'nullable|string|max:500',
                'favicon' => 'nullable|string|max:500',
                'contact_email' => 'sometimes|email',
                'contact_phone' => 'sometimes|string|max:20',
                'website' => 'nullable|url|max:500',
                'support_email' => 'sometimes|email',
                'address' => 'nullable|string|max:500',
                'currency' => 'sometimes|string|max:10',
                'timezone' => 'sometimes|string|max:50',
                'default_language' => 'sometimes|string|max:10',
            ]);

            $this->saveGroup('platform', $validated);

            $settings = $this->allSettings();

            return response()->json([
                'message' => 'Platform settings updated.',
                'data' => $settings['platform'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update platform settings.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function updateNotifications(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email_notifications' => 'boolean',
                'sms_notifications' => 'boolean',
                'push_notifications' => 'boolean',
                'low_stock_alerts' => 'boolean',
                'expiry_alerts' => 'boolean',
                'new_order_alerts' => 'boolean',
                'subscription_expiry_reminder' => 'boolean',
                'reminder_days_before_expiry' => 'integer|min:1|max:90',
            ]);

            $this->saveGroup('notifications', $validated);

            $settings = $this->allSettings();

            return response()->json([
                'message' => 'Notification settings updated.',
                'data' => $settings['notifications'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update notification settings.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }

    public function updateRetention(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'audit_log_retention_days' => 'integer|min:30|max:3650',
                'order_history_retention_days' => 'integer|min:30|max:3650',
                'notification_retention_days' => 'integer|min:7|max:365',
                'auto_delete_expired_data' => 'boolean',
                'backup_frequency' => 'sometimes|in:hourly,daily,weekly,monthly',
            ]);

            $this->saveGroup('retention', $validated);

            $settings = $this->allSettings();

            return response()->json([
                'message' => 'Retention settings updated.',
                'data' => $settings['retention'],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update retention settings.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.',
            ], 500);
        }
    }
}
