<?php
require_once __DIR__ . '/utils/Dotenv.php';
\Utils\Dotenv::load(__DIR__ . '/.env');

echo "Extension loaded: " . (class_exists('MongoDB\Driver\Manager') ? "YES" : "NO") . "\n";
echo "MongoDB URI: " . (getenv('MONGODB_URI') ?: $_ENV['MONGODB_URI'] ?? 'Not set') . "\n";
echo "DB Name: " . (getenv('DB_NAME') ?: $_ENV['DB_NAME'] ?? 'Not set') . "\n";

// Test connecting to MongoDB
try {
    $uri = $_ENV['MONGODB_URI'] ?? '';
    $manager = new \MongoDB\Driver\Manager($uri);
    $command = new \MongoDB\Driver\Command(['ping' => 1]);
    $manager->executeCommand('admin', $command);
    echo "MongoDB Connection: SUCCESS\n";
} catch (Exception $e) {
    echo "MongoDB Connection: FAILED (" . $e->getMessage() . ")\n";
}
