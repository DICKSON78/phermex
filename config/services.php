<?php

return [
    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'mail' => [
        'mailers' => [
            'log' => [
                'transport' => 'log',
                'channel' => env('MAIL_LOG_CHANNEL'),
            ],
        ],
    ],

    'clickpesa' => [
        'enabled' => env('CLICKPESA_ENABLED', false),
        'client_id' => env('CLICKPESA_CLIENT_ID', ''),
        'api_key' => env('CLICKPESA_API_KEY', ''),
        'webhook_secret' => env('CLICKPESA_WEBHOOK_SECRET', ''),
        'base_url' => env('CLICKPESA_BASE_URL', 'https://api.clickpesa.com/third-parties'),
    ],

    'fcm' => [
        'server_key' => env('FCM_SERVER_KEY', ''),
        'project_id' => env('FCM_PROJECT_ID', ''),
    ],

    'jitsi' => [
        'server' => env('JITSI_SERVER', 'https://meet.jit.si'),
    ],
];
