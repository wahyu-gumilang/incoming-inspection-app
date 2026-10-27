<?php

/**
 * Router for the PHP built-in server.
 *
 * Static files under public/ are served directly; every other request goes to
 * the Laravel front controller.
 */
$public = realpath(__DIR__.'/public');
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');
$file = realpath(__DIR__.'/public'.$uri);

if (
    $uri !== '/'
    && $public !== false
    && $file !== false
    && str_starts_with($file, $public.DIRECTORY_SEPARATOR)
    && is_file($file)
) {
    return false;
}

require __DIR__.'/public/index.php';
