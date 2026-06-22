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

try {
    $db = \Config\Database::getInstance();
    echo "Dramas count: " . $db->count('dramas') . "\n";
    echo "Seasons count: " . $db->count('seasons') . "\n";
    echo "Episodes count: " . $db->count('episodes') . "\n";
    echo "Subtitles count: " . $db->count('subtitles') . "\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
