<?php
// bot-seo.php
// Intercepts social media bots (WhatsApp, Facebook, Twitter, etc.)
// and serves them dynamically generated meta tags for accurate link previews.

ini_set('display_errors', 0);
error_reporting(E_ALL);

// Base HTML
$indexPath = __DIR__ . '/../client/dist/index.html';
if (!file_exists($indexPath)) {
    $indexPath = __DIR__ . '/../client/index.html';
}

$html = file_exists($indexPath) ? file_get_contents($indexPath) : '<!DOCTYPE html><html><head><title>KSubZone</title></head><body></body></html>';

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

// Only process if it's a media page (watch, drama, movie)
if (preg_match('#^/(watch|drama|movie)/([a-z0-9-]+)#i', $uri, $matches)) {
    $slug = $matches[2];
    
    // Bootstrap DB
    spl_autoload_register(function ($class) {
        $classPath = str_replace('\\', '/', $class);
        $parts = explode('/', $classPath);
        if (count($parts) > 1) {
            $parts[0] = strtolower($parts[0]);
        }
        $classPath = implode('/', $parts);
        $file = __DIR__ . '/' . $classPath . '.php';
        if (file_exists($file)) require_once $file;
    });
    
    try {
        $db = \Config\Database::getInstance();
        $media = $db->findOne('dramas', ['slug' => $slug]);
        if (!$media) {
            $media = $db->findOne('movies', ['slug' => $slug]);
        }
        
        if ($media) {
            $title = htmlspecialchars($media['title'] . ' - KSubZone');
            $rawDesc = $media['synopsis'] ?? 'Watch ' . $media['title'] . ' on KSubZone with synchronized multi-language subtitles.';
            $desc = htmlspecialchars(mb_substr($rawDesc, 0, 160) . (mb_strlen($rawDesc) > 160 ? '...' : ''));
            $image = htmlspecialchars($media['posterPath'] ?? $media['backdropPath'] ?? 'https://ksubzone.com/assets/default-share.jpg');
            
            // Check if image is relative path, convert to absolute
            if (strpos($image, 'http') !== 0) {
                $host = $_SERVER['HTTP_HOST'] ?? 'ksubzone.com';
                $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
                $image = $protocol . '://' . $host . (strpos($image, '/') === 0 ? '' : '/') . $image;
            }

            // Replace meta tags in HTML
            $html = preg_replace('/<title>.*?<\/title>/is', "<title>$title</title>", $html);
            $html = preg_replace('/<meta name="description" content=".*?">/is', '<meta name="description" content="'.$desc.'">', $html);
            $html = preg_replace('/<meta name="title" content=".*?">/is', '<meta name="title" content="'.$title.'">', $html);
            
            $html = preg_replace('/<meta property="og:title" content=".*?">/is', '<meta property="og:title" content="'.$title.'">', $html);
            $html = preg_replace('/<meta property="og:description" content=".*?">/is', '<meta property="og:description" content="'.$desc.'">', $html);
            $html = preg_replace('/<meta property="og:image" content=".*?">/is', '<meta property="og:image" content="'.$image.'">', $html);
            
            $html = preg_replace('/<meta property="twitter:title" content=".*?">/is', '<meta property="twitter:title" content="'.$title.'">', $html);
            $html = preg_replace('/<meta property="twitter:description" content=".*?">/is', '<meta property="twitter:description" content="'.$desc.'">', $html);
            $html = preg_replace('/<meta property="twitter:image" content=".*?">/is', '<meta property="twitter:image" content="'.$image.'">', $html);
        }
    } catch (\Exception $e) {
        // Silently fail and serve default HTML for bots if DB error
    }
}

echo $html;
exit;
