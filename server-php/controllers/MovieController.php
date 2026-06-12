<?php
namespace Controllers;

use Config\Database;
use Utils\Slug;

class MovieController {
    public static function getAllMovies() {
        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 12);
        $search = $_GET['search'] ?? null;
        $genre = $_GET['genre'] ?? null;
        $year = $_GET['year'] ?? null;
        $country = $_GET['country'] ?? null;
        $language = $_GET['language'] ?? null;
        $rating = $_GET['rating'] ?? null;
        $sort = $_GET['sort'] ?? null;
        $status = $_GET['status'] ?? null;
        $trending = $_GET['trending'] ?? null;
        $isHistorical = $_GET['isHistorical'] ?? null;

        $filter = [];
        
        if ($status && $status !== 'All') {
            $filter['status'] = $status;
        } elseif (!$status) {
            $filter['status'] = 'Published';
        }

        if ($isHistorical === 'true') {
            $filter['isHistorical'] = true;
        }

        if (!empty($search)) {
            $filter['$text'] = ['$search' => $search];
        }

        if (!empty($genre)) {
            $filter['keywords'] = ['$in' => [$genre]];
        }

        if (!empty($year)) {
            $filter['releaseDate'] = [
                '$gte' => "{$year}-01-01 00:00:00",
                '$lte' => "{$year}-12-31 23:59:59"
            ];
        }

        if (!empty($country)) {
            $filter['country'] = $country;
        }

        if (!empty($language)) {
            $filter['language'] = $language;
        }

        if ($trending === 'true') {
            $filter['isTrending'] = true;
        }

        if (!empty($rating)) {
            $filter['imdbRating'] = ['$gte' => (float)$rating];
        }

        $sortOptions = ['createdAt' => -1];
        if ($sort === 'oldest') {
            $sortOptions = ['releaseDate' => 1];
        } elseif ($sort === 'newest') {
            $sortOptions = ['releaseDate' => -1];
        } elseif ($sort === 'rating') {
            $sortOptions = ['imdbRating' => -1, 'tmdbRating' => -1];
        } elseif ($sort === 'popular' || $sort === 'views') {
            $sortOptions = ['viewCount' => -1];
        } elseif ($sort === 'az') {
            $sortOptions = ['title' => 1];
        }

        $skip = ($page - 1) * $limit;
        $db = Database::getInstance();
        $total = $db->count('movies', $filter);
        $movies = $db->find('movies', $filter, [
            'sort' => $sortOptions,
            'limit' => $limit,
            'skip' => $skip
        ]);

        // Append subtitle count to each movie
        $movieIds = array_map(function($m) { return $m['_id']; }, $movies);
        if (!empty($movieIds)) {
            $subtitles = $db->find('subtitles', [
                'mediaId' => ['$in' => $movieIds]
            ]);
            $subsCountByMediaId = [];
            foreach($subtitles as $sub) {
                 $mid = (string)$sub['mediaId'];
                 if (!isset($subsCountByMediaId[$mid])) $subsCountByMediaId[$mid] = 0;
                 $subsCountByMediaId[$mid]++;
            }
            foreach($movies as &$m) {
                 $mid = (string)$m['_id'];
                 $m['subtitleCount'] = $subsCountByMediaId[$mid] ?? 0;
            }
        }

        header('Content-Type: application/json');
        echo json_encode([
            'total' => $total,
            'page' => $page,
            'totalPages' => ceil($total / $limit),
            'movies' => $movies
        ]);
    }

    public static function getHomeCatalog() {
        $db = Database::getInstance();
        $statusFilter = ['status' => 'Published'];

        // 1. Latest movies (status: Published, sort: releaseDate DESC, limit 12)
        $latestMovies = $db->find('movies', $statusFilter, ['sort' => ['releaseDate' => -1], 'limit' => 12]);
        
        // 2. Latest dramas (status: Published, sort: releaseDate DESC, limit 12)
        $latestDramas = $db->find('dramas', $statusFilter, ['sort' => ['releaseDate' => -1], 'limit' => 12]);
        
        // 3. Historical movies (status: Published, isHistorical: true, sort: imdbRating DESC, limit 12)
        $historicalMovies = $db->find('movies', array_merge($statusFilter, ['isHistorical' => true]), ['sort' => ['imdbRating' => -1], 'limit' => 12]);
        
        // 4. Historical dramas (status: Published, isHistorical: true, sort: imdbRating DESC, limit 12)
        $historicalDramas = $db->find('dramas', array_merge($statusFilter, ['isHistorical' => true]), ['sort' => ['imdbRating' => -1], 'limit' => 12]);
        
        // 5. Trending movies (status: Published, isTrending: true, sort: viewCount DESC, limit 12)
        $trendingMovies = $db->find('movies', array_merge($statusFilter, ['isTrending' => true]), ['sort' => ['viewCount' => -1], 'limit' => 12]);
        
        // 6. Trending dramas (status: Published, isTrending: true, sort: viewCount DESC, limit 12)
        $trendingDramas = $db->find('dramas', array_merge($statusFilter, ['isTrending' => true]), ['sort' => ['viewCount' => -1], 'limit' => 12]);
        
        // 7. Popular movies (status: Published, sort: viewCount DESC, limit 12)
        $popularMovies = $db->find('movies', $statusFilter, ['sort' => ['viewCount' => -1], 'limit' => 12]);
        
        // 8. Popular dramas (status: Published, sort: viewCount DESC, limit 12)
        $popularDramas = $db->find('dramas', $statusFilter, ['sort' => ['viewCount' => -1], 'limit' => 12]);

        // Batch append subtitle summaries to all fetched drama lists
        $allDramas = [];
        foreach ($latestDramas as $d) {
            $allDramas[$d['_id']] = $d;
        }
        foreach ($historicalDramas as $d) {
            $allDramas[$d['_id']] = $d;
        }
        foreach ($trendingDramas as $d) {
            $allDramas[$d['_id']] = $d;
        }
        foreach ($popularDramas as $d) {
            $allDramas[$d['_id']] = $d;
        }
        
        $allDramasArray = array_values($allDramas);
        DramaController::appendSubtitleSummariesToDramas($allDramasArray);
        
        // Map summaries back to the original lists
        $summaries = [];
        foreach ($allDramasArray as $d) {
            $summaries[$d['_id']] = $d['subtitleSummary'];
        }
        
        foreach ($latestDramas as &$d) {
            $d['subtitleSummary'] = $summaries[$d['_id']];
        }
        unset($d);
        foreach ($historicalDramas as &$d) {
            $d['subtitleSummary'] = $summaries[$d['_id']];
        }
        unset($d);
        foreach ($trendingDramas as &$d) {
            $d['subtitleSummary'] = $summaries[$d['_id']];
        }
        unset($d);
        foreach ($popularDramas as &$d) {
            $d['subtitleSummary'] = $summaries[$d['_id']];
        }
        unset($d);

        header('Content-Type: application/json');
        echo json_encode([
            'latestMovies' => $latestMovies,
            'latestDramas' => $latestDramas,
            'historicalMovies' => $historicalMovies,
            'historicalDramas' => $historicalDramas,
            'trendingMovies' => $trendingMovies,
            'trendingDramas' => $trendingDramas,
            'popularMovies' => $popularMovies,
            'popularDramas' => $popularDramas
        ]);
    }


    public static function getMovieBySlug($slug) {
        $db = Database::getInstance();
        
        // Match exact slug and legacy links that stripped unique numeric suffixes.
        $movie = Slug::findByPermalinkSlug($db, 'movies', $slug);
        if (!$movie) {
            http_response_code(404);
            echo json_encode(['message' => 'Movie not found']);
            return;
        }

        if (($movie['status'] ?? 'Published') !== 'Published' && !\Middleware\AuthMiddleware::isAdmin()) {
            http_response_code(404);
            echo json_encode(['message' => 'Movie not found']);
            return;
        }

        // Increment views (wrapped in try-catch to prevent DB locking crashes)
        try {
            if ($db->getDriver() !== 'sqlite') {
                $views = ($movie['viewCount'] ?? 0) + 1;
                $db->updateOne('movies', ['_id' => $movie['_id']], ['viewCount' => $views]);
                $movie['viewCount'] = $views;
            }
        } catch (\Exception $e) {
            // Ignore view count write-lock errors to keep page load stable
        }

        // Fetch related movies (excluding current movie, sharing similar keywords)
        $related = [];
        if (!empty($movie['keywords'])) {
            $related = $db->find('movies', [
                '_id' => ['$ne' => $movie['_id']],
                'keywords' => ['$in' => $movie['keywords']]
            ], ['limit' => 4]);
        }

        header('Content-Type: application/json');
        echo json_encode([
            'movie' => $movie,
            'related' => $related
        ]);
    }

    public static function createMovie() {
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        if (empty($data['title'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Movie Title is required']);
            return;
        }

        $db = Database::getInstance();

        // Generate unique slug
        $data['slug'] = Slug::createUniqueSlug(function($candidate) use ($db) {
            return $db->findOne('movies', ['slug' => $candidate]);
        }, $data['title']);

        // Generate AI SEO package
        $seoContent = AiSeoController::generateSeoForTitle($data['title'], $data['description'] ?? '', 'Movie', [
            'genres' => $data['keywords'] ?? [],
            'releaseDate' => $data['releaseDate'] ?? null,
            'director' => $data['director'] ?? '',
            'cast' => array_map(function($c) { return is_array($c) ? ($c['name'] ?? '') : (is_string($c) ? $c : ''); }, $data['cast'] ?? [])
        ]);

        $finalMovieData = array_merge($data, $seoContent);
        $inserted = $db->insertOne('movies', $finalMovieData);

        http_response_code(201);
        echo json_encode(['message' => 'Movie created successfully', 'movie' => $inserted]);
    }

    public static function updateMovie($id) {
        $updates = json_decode(file_get_contents('php://input'), true) ?: [];
        $db = Database::getInstance();

        $movie = $db->findOne('movies', ['_id' => $id]);
        if (!$movie) {
            http_response_code(404);
            echo json_encode(['message' => 'Movie not found']);
            return;
        }

        // Re-generate SEO package if title or description changes
        if (!empty($updates['title']) || !empty($updates['description'])) {
            $title = $updates['title'] ?? $movie['title'];
            $desc = $updates['description'] ?? $movie['description'] ?? '';
            $seoContent = AiSeoController::generateSeoForTitle($title, $desc, 'Movie', [
                'genres' => $updates['keywords'] ?? $movie['keywords'] ?? [],
                'releaseDate' => $updates['releaseDate'] ?? $movie['releaseDate'] ?? null,
                'director' => $updates['director'] ?? $movie['director'] ?? '',
                'cast' => array_map(function($c) { return is_array($c) ? ($c['name'] ?? '') : (is_string($c) ? $c : ''); }, $updates['cast'] ?? $movie['cast'] ?? [])
            ]);
            $updates = array_merge($updates, $seoContent);
        }



        $db->updateOne('movies', ['_id' => $id], $updates);
        $updatedMovie = $db->findOne('movies', ['_id' => $id]);

        header('Content-Type: application/json');
        echo json_encode(['message' => 'Movie updated successfully', 'movie' => $updatedMovie]);
    }

    public static function deleteMovie($id) {
        $db = Database::getInstance();
        $deleted = $db->deleteOne('movies', ['_id' => $id]);
        if (!$deleted) {
            http_response_code(404);
            echo json_encode(['message' => 'Movie not found']);
            return;
        }
        header('Content-Type: application/json');
        echo json_encode(['message' => 'Movie deleted successfully']);
    }
}
