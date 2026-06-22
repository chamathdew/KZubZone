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

$_ENV['DB_DRIVER'] = 'pgsql';
$_ENV['DB_NAME'] = 'postgres';
$_ENV['DATABASE_URL'] = 'postgresql://postgres:#Chamathd2002#@db.ejvczjiueysbiewzsuin.supabase.co:5432/postgres';

function testStatus($status) {
    echo "--- Testing status: {$status} ---\n";
    $_GET['status'] = $status;
    $_GET['limit'] = '200';
    try {
        ob_start();
        \Controllers\DramaController::getAllDramas();
        $out = ob_get_clean();
        echo "Success! Length: " . strlen($out) . "\n";
    } catch (\Exception $e) {
        echo "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
    }
}

testStatus('All');
testStatus('Published');
testStatus('Draft');
