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
        
        if ($status) {
            $filter['status'] = $status;
        } else {
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

        header('Content-Type: application/json');
        echo json_encode([
            'total' => $total,
            'page' => $page,
            'totalPages' => ceil($total / $limit),
            'movies' => $movies
        ]);
    }

    public static function getMovieBySlug($slug) {
        $db = Database::getInstance();
        
        // Match exact or legacy pattern
        $movie = $db->findOne('movies', ['slug' => $slug]);
        if (!$movie) {
            // Check legacy patterns
            $clean = Slug::cleanSlug($slug);
            $movie = $db->findOne('movies', ['slug' => ['$in' => [$clean]]]);
            if (!$movie) {
                http_response_code(404);
                echo json_encode(['message' => 'Movie not found']);
                return;
            }
        }

        // Increment views
        $views = ($movie['viewCount'] ?? 0) + 1;
        $db->updateOne('movies', ['_id' => $movie['_id']], ['viewCount' => $views]);
        $movie['viewCount'] = $views;

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
            'cast' => array_map(function($c) { return $c['name'] ?? ''; }, $data['cast'] ?? [])
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
                'cast' => array_map(function($c) { return $c['name'] ?? ''; }, $updates['cast'] ?? $movie['cast'] ?? [])
            ]);
            $updates = array_merge($updates, $seoContent);
        }

        if (!empty($updates['title']) && $updates['title'] !== $movie['title']) {
            $updates['slug'] = Slug::createUniqueSlug(function($candidate) use ($db) {
                return $db->findOne('movies', ['slug' => $candidate]);
            }, $updates['title'], $movie['_id']);
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
