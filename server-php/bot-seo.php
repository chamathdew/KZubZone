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
        $isMovie = false;
        $isEpisodePage = false;
        $seasonNumber = null;
        $episodeNumber = null;
        $episode = null;
        $episodeSchema = null;
        $breadcrumbs = null;

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
            if (($routeType === 'drama' || $routeType === 'watch') && preg_match('#/season-([0-9]+)/episode-([0-9]+)#i', $uri, $epMatches)) {
                $isEpisodePage = true;
                $seasonNumber = (int)$epMatches[1];
                $episodeNumber = (int)$epMatches[2];
            }

            $media = $db->findOne('dramas', ['slug' => $slug]);
            if (!$media) {
                $media = $db->findOne('movies', ['slug' => $slug]);
                $isMovie = true;
            }
            
            if ($media) {
                if ($isEpisodePage && !$isMovie) {
                    $season = $db->findOne('seasons', ['dramaId' => $media['_id'], 'seasonNumber' => $seasonNumber]);
                    if ($season) {
                        $episode = $db->findOne('episodes', [
                            'dramaId' => $media['_id'],
                            'seasonId' => $season['_id'],
                            'episodeNumber' => $episodeNumber
                        ]);
                    }
                    
                    if ($episode) {
                        $title = htmlspecialchars($media['title'] . ' S' . sprintf('%02d', $seasonNumber) . 'E' . sprintf('%02d', $episodeNumber) . (!empty($episode['episodeTitle']) ? ' "' . $episode['episodeTitle'] . '"' : '') . ' Sinhala Subtitles | KSubZone');
                        $rawDesc = $episode['episodeDescription'] ?: 'Download Sinhala and English subtitles for ' . $media['title'] . ' S' . sprintf('%02d', $seasonNumber) . 'E' . sprintf('%02d', $episodeNumber) . '.';
                        $desc = htmlspecialchars(mb_substr($rawDesc, 0, 160) . (mb_strlen($rawDesc) > 160 ? '...' : ''));
                        $image = htmlspecialchars($episode['episodeThumbnail'] ?: $media['posterPath'] ?: $media['backdropPath'] ?: 'https://www.ksubzone.com/assets/default-share.jpg');
                        
                        $episodeSchema = $episode['episodeSchemaMarkup'] ?? null;
                        if (empty($episodeSchema) || !is_array($episodeSchema)) {
                            $episodeSchema = [
                                "@context" => "https://schema.org",
                                "@type" => "TVEpisode",
                                "name" => $episode['episodeTitle'] ?: "Episode " . $episodeNumber,
                                "episodeNumber" => $episodeNumber,
                                "description" => $rawDesc,
                                "datePublished" => $episode['airDate'] ?? null,
                                "partOfSeason" => [
                                    "@type" => "TVSeason",
                                    "seasonNumber" => $seasonNumber
                                ],
                                "partOfSeries" => [
                                    "@type" => "TVSeries",
                                    "name" => $media['title'],
                                    "sameAs" => "https://www.ksubzone.com/drama/" . $media['slug']
                                ]
                            ];
                        }
                    } else {
                        $title = htmlspecialchars($media['metaTitle'] ?? ($media['title'] . ' - KSubZone'));
                        $rawDesc = $media['metaDescription'] ?? $media['synopsis'] ?? 'Watch ' . $media['title'] . ' on KSubZone with synchronized multi-language subtitles.';
                        $desc = htmlspecialchars(mb_substr($rawDesc, 0, 160) . (mb_strlen($rawDesc) > 160 ? '...' : ''));
                        $image = htmlspecialchars($media['posterPath'] ?? $media['backdropPath'] ?? 'https://www.ksubzone.com/assets/default-share.jpg');
                    }
                } else {
                    $title = htmlspecialchars($media['metaTitle'] ?? ($media['title'] . ' - KSubZone'));
                    $rawDesc = $media['metaDescription'] ?? $media['synopsis'] ?? 'Watch ' . $media['title'] . ' on KSubZone with synchronized multi-language subtitles.';
                    $desc = htmlspecialchars(mb_substr($rawDesc, 0, 160) . (mb_strlen($rawDesc) > 160 ? '...' : ''));
                    $image = htmlspecialchars($media['posterPath'] ?? $media['backdropPath'] ?? 'https://www.ksubzone.com/assets/default-share.jpg');
                }
            }
        }

        // Build BreadcrumbList Schema
        if ($media) {
            $listElements = [
                [
                    "@type" => "ListItem",
                    "position" => 1,
                    "name" => "KSubZone",
                    "item" => "https://www.ksubzone.com"
                ]
            ];
            
            if ($routeType === 'articles') {
                $listElements[] = [
                    "@type" => "ListItem",
                    "position" => 2,
                    "name" => "Articles",
                    "item" => "https://www.ksubzone.com/articles"
                ];
                $listElements[] = [
                    "@type" => "ListItem",
                    "position" => 3,
                    "name" => $media['title'],
                    "item" => "https://www.ksubzone.com/articles/" . $media['slug']
                ];
            } else if ($isMovie) {
                $listElements[] = [
                    "@type" => "ListItem",
                    "position" => 2,
                    "name" => "Movies",
                    "item" => "https://www.ksubzone.com/movies"
                ];
                $listElements[] = [
                    "@type" => "ListItem",
                    "position" => 3,
                    "name" => $media['title'],
                    "item" => "https://www.ksubzone.com/movie/" . $media['slug']
                ];
            } else {
                $listElements[] = [
                    "@type" => "ListItem",
                    "position" => 2,
                    "name" => "Dramas",
                    "item" => "https://www.ksubzone.com/dramas"
                ];
                $listElements[] = [
                    "@type" => "ListItem",
                    "position" => 3,
                    "name" => $media['title'],
                    "item" => "https://www.ksubzone.com/drama/" . $media['slug']
                ];
                
                if ($isEpisodePage && $episode) {
                    $listElements[] = [
                        "@type" => "ListItem",
                        "position" => 4,
                        "name" => "Season " . $seasonNumber,
                        "item" => "https://www.ksubzone.com/drama/" . $media['slug'] . "/season-" . $seasonNumber
                    ];
                    $listElements[] = [
                        "@type" => "ListItem",
                        "position" => 5,
                        "name" => "Episode " . $episodeNumber,
                        "item" => "https://www.ksubzone.com/drama/" . $media['slug'] . "/season-" . $seasonNumber . "/episode-" . $episodeNumber
                    ];
                }
            }
            
            $breadcrumbs = [
                "@context" => "https://schema.org",
                "@type" => "BreadcrumbList",
                "itemListElement" => $listElements
            ];
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

            // Inject TVEpisode schema for episode page, otherwise inject main media schema (Movie / TVSeries)
            if (!empty($episodeSchema)) {
                $epSchemaScript = '<script type="application/ld+json">' . json_encode($episodeSchema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . '</script>';
                $html = preg_replace('/<\/head>/i', $epSchemaScript . "\n</head>", $html);
            } else if (!empty($media['schemaMarkup']) && is_array($media['schemaMarkup'])) {
                $mainSchema = json_encode($media['schemaMarkup'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                $mainSchemaScript = '<script type="application/ld+json">' . $mainSchema . '</script>';
                $html = preg_replace('/<\/head>/i', $mainSchemaScript . "\n</head>", $html);
            }

            // Inject BreadcrumbList schema
            if (!empty($breadcrumbs)) {
                $bcScript = '<script type="application/ld+json">' . json_encode($breadcrumbs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . '</script>';
                $html = preg_replace('/<\/head>/i', $bcScript . "\n</head>", $html);
            }

            // Inject FAQPage schema for Googlebot so FAQ rich results appear in Google Search.
            // The faq array is populated by AiSeoController::generateFaqList() when AI SEO is run.
            if (!empty($media['faq']) && is_array($media['faq'])) {
                $faqEntities = [];
                foreach ($media['faq'] as $item) {
                    $question = htmlspecialchars_decode($item['question'] ?? '', ENT_QUOTES);
                    $answer   = htmlspecialchars_decode($item['answer']   ?? '', ENT_QUOTES);
                    if (empty($question) || empty($answer)) continue;
                    $faqEntities[] = [
                        '@type'          => 'Question',
                        'name'           => $question,
                        'acceptedAnswer' => [
                            '@type' => 'Answer',
                            'text'  => $answer
                        ]
                    ];
                }

                if (!empty($faqEntities)) {
                    $faqSchema = [
                        '@context'   => 'https://schema.org',
                        '@type'      => 'FAQPage',
                        'mainEntity' => $faqEntities
                    ];
                    $faqScript = '<script type="application/ld+json">'
                        . json_encode($faqSchema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                        . '</script>';
                    $html = preg_replace('/<\/head>/i', $faqScript . "\n</head>", $html);
                }
            }

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
