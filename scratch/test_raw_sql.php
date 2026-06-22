<?php
$_ENV['DATABASE_URL'] = 'postgresql://postgres:#Chamathd2002#@db.ejvczjiueysbiewzsuin.supabase.co:5432/postgres';

$urlWithoutScheme = str_replace(['postgresql://', 'postgres://'], '', $_ENV['DATABASE_URL']);
$lastAtPos = strrpos($urlWithoutScheme, '@');
$credentials = substr($urlWithoutScheme, 0, $lastAtPos);
$connection = substr($urlWithoutScheme, $lastAtPos + 1);

$credParts = explode(':', $credentials, 2);
$user = rawurldecode($credParts[0]);
$pass = rawurldecode($credParts[1]);

$connParts = explode('/', $connection, 2);
$hostPort = $connParts[0];
$dbName = explode('?', $connParts[1])[0];

$hostParts = explode(':', $hostPort, 2);
$host = $hostParts[0];
$port = $hostParts[1] ?? 5432;

// Auto-translate to IPv4 Session Pooler
if ($host === 'db.ejvczjiueysbiewzsuin.supabase.co') {
    $host = 'aws-1-ap-south-1.pooler.supabase.com';
    $port = 5432;
    if (strpos($user, 'ejvczjiueysbiewzsuin') === false) {
        $user = $user . '.ejvczjiueysbiewzsuin';
    }
}

$dsn = "pgsql:host={$host};port={$port};dbname={$dbName};sslmode=require";

try {
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    
    // Test 1: Simple SELECT SUM on jsonb field
    $sql1 = "SELECT SUM(CAST(COALESCE(CAST(COALESCE(NULLIF(\"data\"->>'viewCount', ''), '0') AS INTEGER), '0') AS INTEGER)) as total FROM \"movies\"";
    echo "Running: $sql1\n";
    $stmt1 = $pdo->query($sql1);
    $res1 = $stmt1->fetch(PDO::FETCH_ASSOC);
    echo "Result 1: " . json_encode($res1) . "\n\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
