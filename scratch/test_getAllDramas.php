<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

spl_autoload_register(function ($class) {
    $classPath = str_replace('\\', '/', $class);
    $parts = explode('/', $classPath);
    if (count($parts) > 1) {
        $parts[0] = strtolower($parts[0]);
    }
    $classPath = implode('/', $parts);
    $file = __DIR__ . '/../server-php/' . $classPath . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use Utils\Dotenv;
Dotenv::load(__DIR__ . '/../server-php/.env');

$_GET['status'] = 'All';
$_GET['limit'] = '200';

try {
    \Controllers\DramaController::getAllDramas();
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
}
