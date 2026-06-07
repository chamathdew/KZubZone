<?php
namespace Controllers;

use Config\Database;

class AnalyticsController {
    private static function getOrCreateRecord() {
        $db = Database::getInstance();
        $record = $db->findOne('analytics');
        if (!$record) {
            $record = [
                'seoHealthScore' => 98,
                'trafficLogs' => [
                    ['date' => '2026-05-18', 'views' => 120, 'uniqueVisitors' => 80],
                    ['date' => '2026-05-19', 'views' => 240, 'uniqueVisitors' => 150],
                    ['date' => '2026-05-20', 'views' => 310, 'uniqueVisitors' => 190],
                    ['date' => '2026-05-21', 'views' => 420, 'uniqueVisitors' => 280],
                    ['date' => '2026-05-22', 'views' => 530, 'uniqueVisitors' => 360]
                ],
                'trendingSearches' => []
            ];
            $record = $db->insertOne('analytics', $record);
        }
        return $record;
    }

    public static function getDashboardStats() {
        $db = Database::getInstance();
        
        $totalMovies = $db->count('movies');
        $totalDramas = $db->count('dramas');
        $totalEpisodes = $db->count('episodes');
        $totalUsers = $db->count('users');
        $totalSubtitles = $db->count('subtitles');
        $totalReviews = $db->count('reviews');

        $analyticsRecord = self::getOrCreateRecord();

        // Top viewed movies & dramas
        $topMovies = $db->find('movies', [], ['sort' => ['viewCount' => -1], 'limit' => 3]);
        $topDramas = $db->find('dramas', [], ['sort' => ['viewCount' => -1], 'limit' => 3]);

        $topContent = [];
        foreach ($topMovies as $m) {
            $topContent[] = [
                '_id' => $m['_id'],
                'title' => $m['title'],
                'slug' => $m['slug'],
                'viewCount' => $m['viewCount'] ?? 0,
                'tmdbRating' => $m['tmdbRating'] ?? 0,
                'type' => 'Movie'
            ];
        }
        foreach ($topDramas as $d) {
            $topContent[] = [
                '_id' => $d['_id'],
                'title' => $d['title'],
                'slug' => $d['slug'],
                'viewCount' => $d['viewCount'] ?? 0,
                'tmdbRating' => $d['tmdbRating'] ?? 0,
                'type' => 'Drama'
            ];
        }

        // Sort topContent by viewCount DESC
        usort($topContent, function($a, $b) {
            return ($b['viewCount'] ?? 0) - ($a['viewCount'] ?? 0);
        });

        header('Content-Type: application/json');
        echo json_encode([
            'counts' => [
                'totalMovies' => $totalMovies,
                'totalDramas' => $totalDramas,
                'totalEpisodes' => $totalEpisodes,
                'totalUsers' => $totalUsers,
                'totalSubtitles' => $totalSubtitles,
                'totalReviews' => $totalReviews
            ],
            'seoHealthScore' => $analyticsRecord['seoHealthScore'] ?? 98,
            'trafficLogs' => $analyticsRecord['trafficLogs'] ?? [],
            'trendingSearches' => $analyticsRecord['trendingSearches'] ?? [],
            'topContent' => $topContent
        ]);
    }

    public static function logPageVisit() {
        $todayStr = date('Y-m-d');
        $db = Database::getInstance();
        $record = self::getOrCreateRecord();

        $logs = $record['trafficLogs'] ?? [];
        $logIndex = -1;
        foreach ($logs as $idx => $log) {
            if ($log['date'] === $todayStr) {
                $logIndex = $idx;
                break;
            }
        }

        if ($logIndex > -1) {
            $logs[$logIndex]['views'] += 1;
        } else {
            $logs[] = ['date' => $todayStr, 'views' => 1, 'uniqueVisitors' => 1];
        }

        $db->updateOne('analytics', ['_id' => $record['_id']], ['trafficLogs' => $logs]);

        // When called via API endpoint (not just middleware hook)
        if (strpos($_SERVER['REQUEST_URI'] ?? '', '/api/analytics/visit') !== false) {
            header('Content-Type: application/json');
            echo json_encode(['message' => 'Visit logged successfully']);
        }
    }

    public static function logSearchQuery($queryStr) {
        if (empty($queryStr) || trim($queryStr) === '') return;
        $queryStr = trim($queryStr);

        $db = Database::getInstance();
        $record = self::getOrCreateRecord();

        $searches = $record['trendingSearches'] ?? [];
        $searchIndex = -1;
        foreach ($searches as $idx => $s) {
            if (strtolower($s['query']) === strtolower($queryStr)) {
                $searchIndex = $idx;
                break;
            }
        }

        if ($searchIndex > -1) {
            $searches[$searchIndex]['count'] += 1;
            $searches[$searchIndex]['lastSearched'] = date('Y-m-d H:i:s');
        } else {
            $searches[] = ['query' => $queryStr, 'count' => 1, 'lastSearched' => date('Y-m-d H:i:s')];
        }

        // Sort descending by count
        usort($searches, function($a, $b) {
            return $b['count'] - $a['count'];
        });

        // Limit to 15 searches
        if (count($searches) > 15) {
            array_pop($searches);
        }

        $db->updateOne('analytics', ['_id' => $record['_id']], ['trendingSearches' => $searches]);
    }

    public static function logSearchQueryRequest() {
        $body = json_decode(file_get_contents('php://input'), true) ?: [];
        $query = $body['query'] ?? '';

        if (empty($query) || trim($query) === '') {
            http_response_code(400);
            echo json_encode(['message' => 'Search query is required']);
            return;
        }

        self::logSearchQuery($query);

        header('Content-Type: application/json');
        echo json_encode(['message' => 'Search query logged']);
    }
}
