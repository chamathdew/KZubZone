<?php
namespace Controllers;

use Config\Database;
use Utils\Slug;

class DramaController {
    public static function getAllDramas() {
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
        $total = $db->count('dramas', $filter);
        $dramas = $db->find('dramas', $filter, [
            'sort' => $sortOptions,
            'limit' => $limit,
            'skip' => $skip
        ]);

        header('Content-Type: application/json');
        echo json_encode([
            'total' => $total,
            'page' => $page,
            'totalPages' => ceil($total / $limit),
            'dramas' => $dramas
        ]);
    }

    public static function getDramaBySlug($slug) {
        $db = Database::getInstance();

        $drama = $db->findOne('dramas', ['slug' => $slug]);
        if (!$drama) {
            // Check legacy patterns
            $clean = Slug::cleanSlug($slug);
            $drama = $db->findOne('dramas', ['slug' => ['$in' => [$clean]]]);
            if (!$drama) {
                http_response_code(404);
                echo json_encode(['message' => 'Drama not found']);
                return;
            }
        }

        // Increment views
        $views = ($drama['viewCount'] ?? 0) + 1;
        $db->updateOne('dramas', ['_id' => $drama['_id']], ['viewCount' => $views]);
        $drama['viewCount'] = $views;

        // Fetch seasons
        $seasons = $db->find('seasons', ['dramaId' => $drama['_id']], ['sort' => ['seasonNumber' => 1]]);

        // Fetch episodes
        $episodes = $db->find('episodes', ['dramaId' => $drama['_id']], ['sort' => ['seasonId' => 1, 'episodeNumber' => 1]]);

        // Fetch related dramas (excluding current, sharing keywords)
        $related = [];
        if (!empty($drama['keywords'])) {
            $related = $db->find('dramas', [
                '_id' => ['$ne' => $drama['_id']],
                'keywords' => ['$in' => $drama['keywords']]
            ], ['limit' => 4]);
        }

        header('Content-Type: application/json');
        echo json_encode([
            'drama' => $drama,
            'seasons' => $seasons,
            'episodes' => $episodes,
            'related' => $related
        ]);
    }

    public static function createDrama() {
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        if (empty($data['title'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Drama Title is required']);
            return;
        }

        $db = Database::getInstance();

        // Unique slug
        $data['slug'] = Slug::createUniqueSlug(function($candidate) use ($db) {
            return $db->findOne('dramas', ['slug' => $candidate]);
        }, $data['title']);

        // Generate AI SEO package
        $seoContent = AiSeoController::generateSeoForTitle($data['title'], $data['description'] ?? '', 'Drama', [
            'genres' => $data['keywords'] ?? [],
            'releaseDate' => $data['releaseDate'] ?? null,
            'director' => $data['director'] ?? '',
            'cast' => array_map(function($c) { return $c['name'] ?? ''; }, $data['cast'] ?? [])
        ]);

        $finalDramaData = array_merge($data, $seoContent);
        $inserted = $db->insertOne('dramas', $finalDramaData);

        http_response_code(201);
        echo json_encode(['message' => 'Drama created successfully', 'drama' => $inserted]);
    }

    public static function updateDrama($id) {
        $updates = json_decode(file_get_contents('php://input'), true) ?: [];
        $db = Database::getInstance();

        $drama = $db->findOne('dramas', ['_id' => $id]);
        if (!$drama) {
            http_response_code(404);
            echo json_encode(['message' => 'Drama not found']);
            return;
        }

        // Re-generate SEO package if title or description changes
        if (!empty($updates['title']) || !empty($updates['description'])) {
            $title = $updates['title'] ?? $drama['title'];
            $desc = $updates['description'] ?? $drama['description'] ?? '';
            $seoContent = AiSeoController::generateSeoForTitle($title, $desc, 'Drama', [
                'genres' => $updates['keywords'] ?? $drama['keywords'] ?? [],
                'releaseDate' => $updates['releaseDate'] ?? $drama['releaseDate'] ?? null,
                'director' => $updates['director'] ?? $drama['director'] ?? '',
                'cast' => array_map(function($c) { return $c['name'] ?? ''; }, $updates['cast'] ?? $drama['cast'] ?? [])
            ]);
            $updates = array_merge($updates, $seoContent);
        }

        if (!empty($updates['title']) && $updates['title'] !== $drama['title']) {
            $updates['slug'] = Slug::createUniqueSlug(function($candidate) use ($db) {
                return $db->findOne('dramas', ['slug' => $candidate]);
            }, $updates['title'], $drama['_id']);
        }

        $db->updateOne('dramas', ['_id' => $id], $updates);
        $updatedDrama = $db->findOne('dramas', ['_id' => $id]);

        header('Content-Type: application/json');
        echo json_encode(['message' => 'Drama updated successfully', 'drama' => $updatedDrama]);
    }

    public static function deleteDrama($id) {
        $db = Database::getInstance();
        $deleted = $db->deleteOne('dramas', ['_id' => $id]);
        if (!$deleted) {
            http_response_code(404);
            echo json_encode(['message' => 'Drama not found']);
            return;
        }

        // Delete cascading seasons and episodes
        $db->deleteMany('seasons', ['dramaId' => $id]);
        $db->deleteMany('episodes', ['dramaId' => $id]);

        header('Content-Type: application/json');
        echo json_encode(['message' => 'Drama and cascading seasons/episodes deleted']);
    }

    /* --- SEASON MANAGEMENT --- */

    public static function addSeason() {
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $dramaId = $data['dramaId'] ?? null;
        $seasonNumber = $data['seasonNumber'] ?? null;

        if (!$dramaId || !$seasonNumber) {
            http_response_code(400);
            echo json_encode(['message' => 'Drama ID and Season Number are required']);
            return;
        }

        $db = Database::getInstance();
        $inserted = $db->insertOne('seasons', [
            'dramaId' => $dramaId,
            'seasonNumber' => (int)$seasonNumber,
            'seasonDescription' => $data['seasonDescription'] ?? '',
            'seasonPoster' => $data['seasonPoster'] ?? '',
            'airDate' => $data['airDate'] ?? null
        ]);

        http_response_code(201);
        echo json_encode(['message' => 'Season added successfully', 'season' => $inserted]);
    }

    public static function editSeason($id) {
        $updates = json_decode(file_get_contents('php://input'), true) ?: [];
        $db = Database::getInstance();

        $season = $db->findOne('seasons', ['_id' => $id]);
        if (!$season) {
            http_response_code(404);
            echo json_encode(['message' => 'Season not found']);
            return;
        }

        $db->updateOne('seasons', ['_id' => $id], $updates);
        $updated = $db->findOne('seasons', ['_id' => $id]);

        header('Content-Type: application/json');
        echo json_encode(['message' => 'Season updated successfully', 'season' => $updated]);
    }

    public static function deleteSeason($id) {
        $db = Database::getInstance();
        $deleted = $db->deleteOne('seasons', ['_id' => $id]);
        if (!$deleted) {
            http_response_code(404);
            echo json_encode(['message' => 'Season not found']);
            return;
        }

        // Cascade delete episodes
        $db->deleteMany('episodes', ['seasonId' => $id]);

        header('Content-Type: application/json');
        echo json_encode(['message' => 'Season and episodes deleted successfully']);
    }

    /* --- EPISODE MANAGEMENT --- */

    public static function addEpisode() {
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $dramaId = $data['dramaId'] ?? null;
        $seasonId = $data['seasonId'] ?? null;
        $episodeNumber = $data['episodeNumber'] ?? null;
        $episodeTitle = $data['episodeTitle'] ?? null;

        if (!$dramaId || !$seasonId || !$episodeNumber || !$episodeTitle) {
            http_response_code(400);
            echo json_encode(['message' => 'Drama ID, Season ID, Episode Number, and Title are required']);
            return;
        }

        $db = Database::getInstance();
        $season = $db->findOne('seasons', ['_id' => $seasonId]);
        $drama = $db->findOne('dramas', ['_id' => $dramaId]);

        if (!$season || !$drama) {
            http_response_code(404);
            echo json_encode(['message' => 'Drama or Season parent reference not found']);
            return;
        }

        $epSchema = [
            "@context" => "https://schema.org",
            "@type" => "TVEpisode",
            "name" => $episodeTitle,
            "episodeNumber" => (int)$episodeNumber,
            "description" => $data['episodeDescription'] ?? '',
            "datePublished" => $data['airDate'] ?? null,
            "partOfSeason" => [
                "@type" => "TVSeason",
                "seasonNumber" => $season['seasonNumber'] ?? 1
            ],
            "partOfSeries" => [
                "@type" => "TVSeries",
                "name" => $drama['title'] ?? ''
            ]
        ];

        $episode = [
            'dramaId' => $dramaId,
            'seasonId' => $seasonId,
            'episodeNumber' => (int)$episodeNumber,
            'episodeTitle' => $episodeTitle,
            'episodeDescription' => $data['episodeDescription'] ?? '',
            'episodeThumbnail' => $data['episodeThumbnail'] ?? ($drama['banner'] ?? ''),
            'airDate' => $data['airDate'] ?? null,
            'runtime' => (int)($data['runtime'] ?? ($drama['runtime'] ?? 60)),
            'trailer' => $data['trailer'] ?? '',
            'videoUrl' => $data['videoUrl'] ?? 'https://www.w3schools.com/html/mov_bbb.mp4',
            'aiEpisodeSummary' => "AI generated recap for " . ($drama['title'] ?? '') . " S" . ($season['seasonNumber'] ?? 1) . "E" . $episodeNumber . ": " . ($data['episodeDescription'] ?? ''),
            'episodeSchemaMarkup' => $epSchema
        ];

        $inserted = $db->insertOne('episodes', $episode);

        http_response_code(201);
        echo json_encode(['message' => 'Episode created successfully', 'episode' => $inserted]);
    }

    public static function editEpisode($id) {
        $updates = json_decode(file_get_contents('php://input'), true) ?: [];
        $db = Database::getInstance();

        $episode = $db->findOne('episodes', ['_id' => $id]);
        if (!$episode) {
            http_response_code(404);
            echo json_encode(['message' => 'Episode not found']);
            return;
        }

        $db->updateOne('episodes', ['_id' => $id], $updates);
        $updated = $db->findOne('episodes', ['_id' => $id]);

        header('Content-Type: application/json');
        echo json_encode(['message' => 'Episode updated successfully', 'episode' => $updated]);
    }

    public static function deleteEpisode($id) {
        $db = Database::getInstance();
        $deleted = $db->deleteOne('episodes', ['_id' => $id]);
        if (!$deleted) {
            http_response_code(404);
            echo json_encode(['message' => 'Episode not found']);
            return;
        }

        header('Content-Type: application/json');
        echo json_encode(['message' => 'Episode deleted successfully']);
    }
}
