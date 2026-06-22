<?php
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

$_ENV['DB_DRIVER'] = 'pgsql';
$_ENV['DB_NAME'] = 'postgres';
$_ENV['DATABASE_URL'] = 'postgresql://postgres:#Chamathd2002#@db.ejvczjiueysbiewzsuin.supabase.co:5432/postgres';

$_GET['status'] = 'All';
$_GET['limit'] = '200';

try {
    ob_start();
    \Controllers\DramaController::getAdminDramas();
    $out = ob_get_clean();
    $json = json_decode($out, true);
    if ($json === null) {
        echo "JSON Decode failed: " . json_last_error_msg() . "\n";
        echo "Raw: " . substr($out, 0, 500) . "\n";
    } else {
        echo "JSON Decode success!\n";
        echo "Total: " . ($json['total'] ?? 'N/A') . "\n";
        echo "Dramas: " . count($json['dramas'] ?? []) . "\n";
    }
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
