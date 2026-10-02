<?php

/**
 * Custom router for `php artisan serve`.
 *
 * The PHP built-in server treats `public/dashboard/` (the built SPA directory)
 * as a directory index, so a request to /dashboard/pos arrives with
 * SCRIPT_NAME=/dashboard/index.html and PATH_INFO=/pos, which corrupts the
 * path Laravel sees (it would parse "pos" instead of "dashboard/pos").
 * We restore SCRIPT_NAME to /index.php so the dashboard SPA history fallback
 * (/dashboard/{any?}) matches correctly. Real static files (assets, images)
 * are still served directly by the built-in server.
 */

$publicPath = getcwd();

$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? ''
);

// Serve existing static files directly (e.g. /dashboard/assets/*.js).
if ($uri !== '/' && file_exists($publicPath.$uri)) {
    return false;
}

// php -S picked the directory index of the built dashboard; force Laravel's
// index.php and let Laravel re-derive the path from the original REQUEST_URI.
if (($_SERVER['SCRIPT_NAME'] ?? '') === '/dashboard/index.html') {
    $_SERVER['SCRIPT_NAME'] = '/index.php';
    $_SERVER['SCRIPT_FILENAME'] = $publicPath.'/index.php';
    $_SERVER['PATH_INFO'] = null;
    $_SERVER['PHP_SELF'] = '/index.php';
}

require_once $publicPath.'/index.php';