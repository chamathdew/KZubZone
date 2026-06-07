<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    $uri = "mongodb+srv://chamathdewcrypto_db_user:burnitdown@kdramauniverse.2sco96j.mongodb.net/?appName=kdramauniverse";
    $manager = new MongoDB\Driver\Manager($uri);
    $command = new MongoDB\Driver\Command(['listDatabases' => 1]);
    $cursor = $manager->executeCommand('admin', $command);
    $response = current($cursor->toArray());
    echo "Databases found:\n";
    foreach ($response->databases as $db) {
        echo "- " . $db->name . "\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
