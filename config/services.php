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

    'subscriptions' => [
        'tzs_per_usd' => (float) env('SUBSCRIPTION_TZS_PER_USD', 2600),
    ],

    'google' => [
        // Firebase project used for Google sign-in (trcticket-b6b01).
        'firebase_project_id' => env('GOOGLE_FIREBASE_PROJECT_ID', 'trcticket-b6b01'),
        // Web app id from the Firebase console: 1:841872361333:web:40e79d57b84fe7b6e1b53c
        'firebase_app_id' => env('GOOGLE_FIREBASE_APP_ID', '1:841872361333:web:40e79d57b84fe7b6e1b53c'),
        // The Web API key. ID tokens minted by the Firebase JS SDK (the web
        // sign-in popup) carry this as their `aud` claim, not the app id.
        'firebase_web_api_key' => env('GOOGLE_FIREBASE_WEB_API_KEY', 'AIzaSyCa66ZgPt5xPkqYK-hOrf3y0ChgrXLpyIs'),
        // Comma separated. Must also contain the Android app id
        // (1:841872361333:android:8cdeca352486dc20e1b53c) and the OAuth client
        // id (841872361333-7ohrhqni6kjtmr3l7lvv911lgl8h2nh6.apps.googleusercontent.com)
        // so tokens minted by the mobile app are accepted too.
        // Defaults cover the web API key (web popup), the web and Android app
        // ids, and the OAuth client that google_sign_in receives on mobile.
        'allowed_audiences' => env('GOOGLE_ALLOWED_AUDIENCES', implode(',', [
            'AIzaSyCa66ZgPt5xPkqYK-hOrf3y0ChgrXLpyIs',
            '1:841872361333:web:40e79d57b84fe7b6e1b53c',
            '1:841872361333:android:8cdeca352486dc20e1b53c',
            '841872361333-7ohrhqni6kjtmr3l7lvv911lgl8h2nh6.apps.googleusercontent.com',
        ])),
    ],

    'fcm' => [
        'server_key' => env('FCM_SERVER_KEY', ''),
        'project_id' => env('FCM_PROJECT_ID', ''),
    ],

    'jitsi' => [
        'server' => env('JITSI_SERVER', 'https://meet.jit.si'),
    ],
];
