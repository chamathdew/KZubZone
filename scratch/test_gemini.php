<?php
require_once __DIR__ . '/../server-php/utils/Dotenv.php';
\Utils\Dotenv::load(__DIR__ . '/../server-php/.env');

require_once __DIR__ . '/../server-php/utils/AiService.php';
require_once __DIR__ . '/../server-php/config/Database.php';

try {
    echo "Testing Gemini API connection...\n";
    $res = \Utils\AiService::generateContent("Translate to Sinhala", "Hello, how are you?", 0.2);
    echo "Response: " . $res . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
