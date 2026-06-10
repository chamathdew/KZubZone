<?php
// test-autoload.php
// Diagnostic script to troubleshoot the autoloading issue on the hosting server.

header('Content-Type: text/plain');

echo "=== Diagnostic Info ===\n";
echo "PHP Version: " . PHP_VERSION . "\n";
echo "Current Directory (__DIR__): " . __DIR__ . "\n";

$dotenvFile = __DIR__ . '/utils/Dotenv.php';
echo "Target Dotenv Path: " . $dotenvFile . "\n";
echo "File exists: " . (file_exists($dotenvFile) ? "YES" : "NO") . "\n";
echo "File readable: " . (is_readable($dotenvFile) ? "YES" : "NO") . "\n";

echo "\n=== Listing Directory: " . __DIR__ . " ===\n";
if (is_dir(__DIR__)) {
    $files = scandir(__DIR__);
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        $path = __DIR__ . '/' . $file;
        echo " - " . $file . " (" . (is_dir($path) ? "DIR" : "FILE") . ")\n";
        
        if ($file === 'utils' && is_dir($path)) {
            echo "   --- Contents of utils/ ---\n";
            $subFiles = scandir($path);
            foreach ($subFiles as $sf) {
                if ($sf === '.' || $sf === '..') continue;
                $sfPath = $path . '/' . $sf;
                echo "     * " . $sf . " (readable: " . (is_readable($sfPath) ? "YES" : "NO") . ")\n";
            }
        }
    }
} else {
    echo "Error: current directory is not valid.\n";
}
