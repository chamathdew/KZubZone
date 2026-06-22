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
$_GET['nocache'] = 1;

try {
    ob_start();
    \Controllers\DramaController::getAllDramas();
    $out = ob_get_clean();
    $json = json_decode($out, true);
    if ($json) {
        foreach ($json['dramas'] as $d) {
            echo "Title: " . $d['title'] . " (Status: " . ($d['status'] ?? 'N/A') . ")\n";
        }
    } else {
        echo "Failed to decode: " . substr($out, 0, 1000) . "\n";
    }
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
