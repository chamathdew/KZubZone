<?php
namespace Utils;

class Revalidate {
    /**
     * Trigger static revalidation for a given path on Next.js frontend.
     * 
     * @param string $path Route path (e.g. '/' or '/drama/moving')
     * @return bool True if revalidation succeeded, false otherwise.
     */
    public static function path($path) {
        $nextUrl = $_ENV['NEXT_JS_URL'] ?? getenv('NEXT_JS_URL') ?: 'http://127.0.0.1:3000';
        $token = $_ENV['REVALIDATION_TOKEN'] ?? getenv('REVALIDATION_TOKEN') ?: 'ksubzone_reval_secret_2026';
        
        $url = rtrim($nextUrl, '/') . '/api/revalidate?secret=' . urlencode($token);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['path' => $path]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $res = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            return true;
        }
        
        error_log("Revalidation request failed for '{$path}' to Next.js (HTTP {$httpCode}): {$res}");
        return false;
    }

    /**
     * Helper to revalidate movie or drama page.
     * 
     * @param string $type 'movie' or 'drama'
     * @param string $slugpermalink slug
     * @return bool
     */
    public static function media($type, $slug) {
        $cleanType = strtolower($type);
        if ($cleanType !== 'movie' && $cleanType !== 'drama') {
            return false;
        }
        return self::path("/{$cleanType}/{$slug}");
    }
}
