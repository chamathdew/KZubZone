<?php
// ONE-TIME ADMIN CREDENTIAL UPDATE SCRIPT
// =========================================
// Deletes itself after successful execution.
// Access once via: https://ksubzone.com/update-admin-creds.php

ini_set('display_errors', 1);
error_reporting(E_ALL);

// Autoloader
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

use Utils\Dotenv;
Dotenv::load(__DIR__ . '/.env');

use Config\Database;

try {
    $db = Database::getInstance();

    $newEmail    = 'chamathd2002@gmail.com';
    $newPassword = password_hash('#Burnitdown2002#', PASSWORD_BCRYPT);

    // Find first admin
    $admin = $db->findOne('admins', []);

    if (!$admin) {
        echo json_encode(['status' => 'error', 'message' => 'No admin found in database']);
        exit;
    }

    $adminId = $admin['_id'];

    // Update email and password
    $result = $db->updateOne('admins', ['_id' => $adminId], [
        '$set' => [
            'email'    => $newEmail,
            'password' => $newPassword,
        ]
    ]);

    // Self-delete this script
    @unlink(__FILE__);

    header('Content-Type: application/json');
    echo json_encode([
        'status'   => 'success',
        'message'  => 'Admin credentials updated and script deleted.',
        'adminId'  => $adminId,
        'email'    => $newEmail,
    ]);
} catch (\Exception $e) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
