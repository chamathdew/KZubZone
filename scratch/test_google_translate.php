<?php
// Test Google Translate Free endpoint directly
$text = "Hello, how are you?";
$sl = 'en';
$tl = 'si';
$url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" . $sl . "&tl=" . $tl . "&dt=t&q=" . urlencode($text);

echo "Requesting URL: $url\n";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

$response = curl_exec($ch);
$error = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($error) {
    echo "cURL Error: $error\n";
} else {
    echo "HTTP Status Code: $httpCode\n";
    echo "Response: $response\n";
}
