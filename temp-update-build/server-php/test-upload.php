<?php
spl_autoload_register(function ($class) {
    $classPath = str_replace('\\', '/', $class);
    $parts = explode('/', $classPath);
    if (count($parts) > 1) {
        $parts[0] = strtolower($parts[0]);
    }
    $classPath = implode('/', $parts);
    $file = __DIR__ . '/' . $classPath . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use Config\Database;
use Middleware\AuthMiddleware;

try {
    $db = Database::getInstance();
    echo "Driver: " . $db->getDriver() . "\n";
    
    // Simulate user
    $user = $db->findOne('users', []);
    if (!$user) {
        echo "No users found in DB to simulate!\n";
        exit;
    }
    AuthMiddleware::$currentUser = $user;
    echo "Simulating user: " . $user['username'] . "\n";
    
    // Test insert notifications
    $res = $db->insertOne('notifications', [
        'recipientType' => 'Admin',
        'title' => 'Test Subtitle Pending Approval',
        'message' => 'Test message',
        'type' => 'system',
        'isRead' => false
    ]);
    echo "Inserted notification successfully! ID: " . $res['_id'] . "\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
