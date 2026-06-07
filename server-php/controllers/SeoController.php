<?php
namespace Controllers;

use Config\Database;
use Utils\Slug;

class SeoController {
    private static $siteUrl = 'https://ksubzone.com';

    private static function permalinkSlug($item) {
        $titleSlug = Slug::slugify($item['title'] ?? '');
        if ($titleSlug && ($item['slug'] ?? '') === $titleSlug) {
            return $item['slug'];
        }
        if ($titleSlug && strpos($item['slug'] ?? '', $titleSlug . '-') === 0) {
            return $titleSlug;
        }
        return Slug::cleanSlug($item['slug'] ?? '');
    }

    private static function formatDate($dateStr) {
        $time = strtotime($dateStr);
        return $time ? date('Y-m-d', $time) : date('Y-m-d');
    }

    private static function formatIso($dateStr) {
        $time = strtotime($dateStr);
        return $time ? date('Y-m-d\TH:i:s\Z', $time) : date('Y-m-d\TH:i:s\Z');
    }

    public static function getRobotsTxt() {
        header('Content-Type: text/plain');
        echo "User-agent: *\n";
        echo "Allow: /\n";
        echo "Disallow: /management/\n";
        echo "Disallow: /api/\n\n";
        echo "Sitemap: " . self::$siteUrl . "/sitemap.xml\n";
    }

    public static function getSitemapIndex() {
        header('Content-Type: application/xml');
        echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        echo '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        echo '  <sitemap><loc>' . self::$siteUrl . '/sitemap-movies.xml</loc></sitemap>' . "\n";
        echo '  <sitemap><loc>' . self::$siteUrl . '/sitemap-dramas.xml</loc></sitemap>' . "\n";
        echo '  <sitemap><loc>' . self::$siteUrl . '/sitemap-episodes.xml</loc></sitemap>' . "\n";
        echo '  <sitemap><loc>' . self::$siteUrl . '/news-sitemap.xml</loc></sitemap>' . "\n";
        echo '</sitemapindex>';
    }

    public static function getMoviesSitemap() {
        $db = Database::getInstance();
        $movies = $db->find('movies', ['status' => 'Published']);

        header('Content-Type: application/xml');
        echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach ($movies as $movie) {
            $slug = self::permalinkSlug($movie);
            $lastmod = self::formatDate($movie['updatedAt'] ?? '');
            echo "  <url>\n";
            echo "    <loc>" . self::$siteUrl . "/movie/{$slug}</loc>\n";
            echo "    <lastmod>{$lastmod}</lastmod>\n";
            echo "    <changefreq>weekly</changefreq>\n";
            echo "    <priority>0.8</priority>\n";
            echo "  </url>\n";
        }
        echo '</urlset>';
    }

    public static function getDramasSitemap() {
        $db = Database::getInstance();
        $dramas = $db->find('dramas', ['status' => 'Published']);

        header('Content-Type: application/xml');
        echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach ($dramas as $drama) {
            $slug = self::permalinkSlug($drama);
            $lastmod = self::formatDate($drama['updatedAt'] ?? '');
            echo "  <url>\n";
            echo "    <loc>" . self::$siteUrl . "/drama/{$slug}</loc>\n";
            echo "    <lastmod>{$lastmod}</lastmod>\n";
            echo "    <changefreq>weekly</changefreq>\n";
            echo "    <priority>0.8</priority>\n";
            echo "  </url>\n";
            echo "  <url>\n";
            echo "    <loc>" . self::$siteUrl . "/drama/{$slug}/season-1</loc>\n";
            echo "    <lastmod>{$lastmod}</lastmod>\n";
            echo "    <changefreq>weekly</changefreq>\n";
            echo "    <priority>0.6</priority>\n";
            echo "  </url>\n";
        }
        echo '</urlset>';
    }

    public static function getEpisodesSitemap() {
        $db = Database::getInstance();
        $episodes = $db->find('episodes');

        header('Content-Type: application/xml');
        echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach ($episodes as $ep) {
            $drama = $db->findOne('dramas', ['_id' => $ep['dramaId']]);
            $season = $db->findOne('seasons', ['_id' => $ep['seasonId']]);
            if ($drama && $season) {
                $slug = self::permalinkSlug($drama);
                $lastmod = self::formatDate($ep['updatedAt'] ?? '');
                $seasonNum = $season['seasonNumber'] ?? 1;
                $epNum = $ep['episodeNumber'] ?? 1;
                echo "  <url>\n";
                echo "    <loc>" . self::$siteUrl . "/drama/{$slug}/season-{$seasonNum}/episode-{$epNum}</loc>\n";
                echo "    <lastmod>{$lastmod}</lastmod>\n";
                echo "    <changefreq>monthly</changefreq>\n";
                echo "    <priority>0.5</priority>\n";
                echo "  </url>\n";
            }
        }
        echo '</urlset>';
    }

    public static function getNewsSitemap() {
        $db = Database::getInstance();
        // Mimic last 48 hours filter
        $twoDaysAgo = date('Y-m-d H:i:s', time() - 48 * 60 * 60);
        $recentMovies = $db->find('movies', [
            'status' => 'Published',
            'createdAt' => ['$gte' => $twoDaysAgo]
        ], ['limit' => 10]);

        $recentDramas = $db->find('dramas', [
            'status' => 'Published',
            'createdAt' => ['$gte' => $twoDaysAgo]
        ], ['limit' => 10]);

        header('Content-Type: application/xml');
        echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' . "\n";
        echo '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">' . "\n";

        foreach ($recentMovies as $movie) {
            $slug = self::permalinkSlug($movie);
            $pubDate = self::formatIso($movie['createdAt'] ?? '');
            echo "  <url>\n";
            echo "    <loc>" . self::$siteUrl . "/movie/{$slug}</loc>\n";
            echo "    <news:news>\n";
            echo "      <news:publication>\n";
            echo "        <news:name>KSubZone News</news:name>\n";
            echo "        <news:language>en</news:language>\n";
            echo "      </news:publication>\n";
            echo "      <news:publication_date>{$pubDate}</news:publication_date>\n";
            echo "      <news:title>" . htmlspecialchars($movie['title'] ?? '') . " - Imported and Available with Subtitles</news:title>\n";
            echo "    </news:news>\n";
            echo "  </url>\n";
        }

        foreach ($recentDramas as $drama) {
            $slug = self::permalinkSlug($drama);
            $pubDate = self::formatIso($drama['createdAt'] ?? '');
            echo "  <url>\n";
            echo "    <loc>" . self::$siteUrl . "/drama/{$slug}</loc>\n";
            echo "    <news:news>\n";
            echo "      <news:publication>\n";
            echo "        <news:name>KSubZone News</news:name>\n";
            echo "        <news:language>en</news:language>\n";
            echo "      </news:publication>\n";
            echo "      <news:publication_date>{$pubDate}</news:publication_date>\n";
            echo "      <news:title>" . htmlspecialchars($drama['title'] ?? '') . " - Now Streaming on KSubZone</news:title>\n";
            echo "      </news:news>\n";
            echo "  </url>\n";
        }

        echo '</urlset>';
    }
}
