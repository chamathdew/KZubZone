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
    $admins = $db->find('admins');
    foreach ($admins as $admin) {
        echo "Admin ID: " . $admin['_id'] . "\n";
        echo "Username: " . ($admin['username'] ?? 'N/A') . "\n";
        echo "Role: " . (is_array($admin['role']) ? json_encode($admin['role']) : $admin['role']) . "\n";
        
        $roleDoc = $db->findOne('roles', ['_id' => $admin['role']]);
        if ($roleDoc) {
            echo "Role Doc: " . json_encode($roleDoc) . "\n";
        } else {
            echo "Role Doc not found for ID: " . $admin['role'] . "\n";
        }
    }
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
