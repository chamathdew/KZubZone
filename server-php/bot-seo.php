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

// Only process if it's a media page (watch, drama, movie) or article page
if (preg_match('#^/(watch|drama|movie|articles)/([a-z0-9-]+)#i', $uri, $matches)) {
    $routeType = strtolower($matches[1]);
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
        // Load environment variables for database credentials
        if (file_exists(__DIR__ . '/.env')) {
            \Utils\Dotenv::load(__DIR__ . '/.env');
        }

        $db = \Config\Database::getInstance();
        $media = null;
        $title = '';
        $desc = '';
        $image = '';

        if ($routeType === 'articles') {
            $article = $db->findOne('articles', ['slug' => $slug]);
            if ($article) {
                $title = htmlspecialchars($article['metaTitle'] ?: ($article['title'] . ' - KSubZone'));
                $rawDesc = $article['metaDescription'] ?: $article['excerpt'] ?: strip_tags($article['content'] ?? '');
                $desc = htmlspecialchars(mb_substr($rawDesc, 0, 160) . (mb_strlen($rawDesc) > 160 ? '...' : ''));
                $image = htmlspecialchars($article['coverImage'] ?: 'https://www.ksubzone.com/assets/default-share.jpg');
                $media = $article;
            }
        } else {
            $media = $db->findOne('dramas', ['slug' => $slug]);
            if (!$media) {
                $media = $db->findOne('movies', ['slug' => $slug]);
            }
            
            if ($media) {
                $title = htmlspecialchars($media['metaTitle'] ?? ($media['title'] . ' - KSubZone'));
                $rawDesc = $media['metaDescription'] ?? $media['synopsis'] ?? 'Watch ' . $media['title'] . ' on KSubZone with synchronized multi-language subtitles.';
                $desc = htmlspecialchars(mb_substr($rawDesc, 0, 160) . (mb_strlen($rawDesc) > 160 ? '...' : ''));
                $image = htmlspecialchars($media['posterPath'] ?? $media['backdropPath'] ?? 'https://www.ksubzone.com/assets/default-share.jpg');
            }
        }
        
        if ($media) {
            // Check if image is relative path, convert to absolute
            if (strpos($image, 'http') !== 0) {
                $host = $_SERVER['HTTP_HOST'] ?? 'www.ksubzone.com';
                $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
                $image = $protocol . '://' . $host . (strpos($image, '/') === 0 ? '' : '/') . $image;
            }

            // Replace meta tags in HTML (supporting self-closing tags with whitespace like />)
            $html = preg_replace('/<title>.*?<\/title>/is', "<title>$title</title>", $html);
            $html = preg_replace('/<meta\s+name="description"\s+content=".*?"\s*\/?>/is', '<meta name="description" content="'.$desc.'" />', $html);
            $html = preg_replace('/<meta\s+name="title"\s+content=".*?"\s*\/?>/is', '<meta name="title" content="'.$title.'" />', $html);
            
            $html = preg_replace('/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/is', '<meta property="og:title" content="'.$title.'" />', $html);
            $html = preg_replace('/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/is', '<meta property="og:description" content="'.$desc.'" />', $html);
            $html = preg_replace('/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/is', '<meta property="og:image" content="'.$image.'" />', $html);
            
            $html = preg_replace('/<meta\s+property="twitter:title"\s+content=".*?"\s*\/?>/is', '<meta property="twitter:title" content="'.$title.'" />', $html);
            $html = preg_replace('/<meta\s+property="twitter:description"\s+content=".*?"\s*\/?>/is', '<meta property="twitter:description" content="'.$desc.'" />', $html);
            $html = preg_replace('/<meta\s+property="twitter:image"\s+content=".*?"\s*\/?>/is', '<meta property="twitter:image" content="'.$image.'" />', $html);

            // Add canonical tag
            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? 'www.ksubzone.com';
            $canonicalUrl = $protocol . '://' . $host . $uri;
            $html = preg_replace('/<\/head>/i', '<link rel="canonical" href="' . htmlspecialchars($canonicalUrl) . '" />' . "\n</head>", $html);

            // Create fallback visible content for search indexing bots
            $fallbackHtml = "<h1>{$title}</h1>\n<p>{$rawDesc}</p>";
            if (!empty($media['posterPath'] ?? '')) {
                $fallbackHtml .= "\n<img src=\"" . htmlspecialchars($media['posterPath']) . "\" alt=\"" . htmlspecialchars($media['title'] ?? '') . "\" />";
            }
            if ($routeType === 'articles') {
                $fallbackHtml .= "\n<div>" . ($media['content'] ?? '') . "</div>";
            }
            
            // Inject fallback visible HTML in the container for non-JS / crawler indexing
            $html = preg_replace('/<div id="root"><\/div>/is', '<div id="root">' . $fallbackHtml . '</div>', $html);
        }
    } catch (\Exception $e) {
        // Silently fail and serve default HTML for bots if DB error
    }
}

echo $html;
exit;
