<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

if (class_exists('MongoDB\Driver\Manager')) {
    echo "SUCCESS: MongoDB PHP Extension is installed.\n";
    try {
        $uri = "mongodb+srv://chamathdewcrypto_db_user:burnitdown@kdramauniverse.2sco96j.mongodb.net/?appName=kdramauniverse";
        $manager = new MongoDB\Driver\Manager($uri);
        $command = new MongoDB\Driver\Command(['ping' => 1]);
        $manager->executeCommand('admin', $command);
        echo "SUCCESS: Connected to MongoDB Atlas Cloud!\n";
    } catch (Exception $e) {
        echo "ERROR: Could not connect to Atlas: " . $e->getMessage() . "\n";
    }
} else {
    echo "ERROR: MongoDB PHP Extension is NOT installed or enabled in php.ini.\n";
}
