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

    // Google sign-in settings. Deliberately no hardcoded defaults: this project
    // must point at a Firebase project its own team controls, so every value
    // comes from the environment and a missing value is an error rather than a
    // silent fallback to some other project's credentials. See .env.example.
    'google' => [
        // Firebase project id, e.g. "my-pharmex-project". Also used to pin the
        // accepted token issuer to https://securetoken.google.com/<project>.
        'firebase_project_id' => env('GOOGLE_FIREBASE_PROJECT_ID', ''),
        // Web app id from Firebase console > Project settings > Your apps.
        'firebase_app_id' => env('GOOGLE_FIREBASE_APP_ID', ''),
        // Web API key. Some sign-in flows mint this as the `aud` claim.
        'firebase_web_api_key' => env('GOOGLE_FIREBASE_WEB_API_KEY', ''),
        // Comma separated list of audiences this deployment accepts. Must contain
        // the web API key, the web app id, the Android app id
        // (1:<project number>:android:<hash>) and the Android OAuth client id,
        // so tokens minted by the web popup and by google_sign_in are both valid.
        'allowed_audiences' => env('GOOGLE_ALLOWED_AUDIENCES', ''),
    ],

    'fcm' => [
        'server_key' => env('FCM_SERVER_KEY', ''),
        'project_id' => env('FCM_PROJECT_ID', ''),
    ],

    'jitsi' => [
        'server' => env('JITSI_SERVER', 'https://meet.jit.si'),
    ],
];
