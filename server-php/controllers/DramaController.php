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
        $total = $db->count('dramas', $filter);
        $dramas = $db->find('dramas', $filter, [
            'sort' => $sortOptions,
            'limit' => $limit,
            'skip' => $skip
        ]);

        self::appendSubtitleSummariesToDramas($dramas);

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

        $drama = Slug::findByPermalinkSlug($db, 'dramas', $slug);
        if (!$drama) {
            http_response_code(404);
            echo json_encode(['message' => 'Drama not found']);
            return;
        }

        if (($drama['status'] ?? 'Published') !== 'Published' && !\Middleware\AuthMiddleware::isAdmin()) {
            http_response_code(404);
            echo json_encode(['message' => 'Drama not found']);
            return;
        }

        // Increment views (wrapped in try-catch to prevent DB locking crashes)
        try {
            if ($db->getDriver() !== 'sqlite') {
                $views = ($drama['viewCount'] ?? 0) + 1;
                $db->updateOne('dramas', ['_id' => $drama['_id']], ['viewCount' => $views]);
                $drama['viewCount'] = $views;
            }
        } catch (\Exception $e) {
            // Ignore view count write-lock errors to keep page load stable
        }

        // Dynamic subtitle summary
        $drama['subtitleSummary'] = self::getSubtitleSummaryForDrama($drama['_id']);

        // Fetch seasons
        $seasons = $db->find('seasons', ['dramaId' => $drama['_id']], ['sort' => ['seasonNumber' => 1]]);

        // Fetch episodes
        $episodes = $db->find('episodes', ['dramaId' => $drama['_id']], ['sort' => ['seasonId' => 1, 'episodeNumber' => 1]]);

        // Map seasonId to seasonNumber for proper ordering across seasons
        $seasonNumberMap = [];
        foreach ($seasons as $s) {
            $seasonNumberMap[(string)$s['_id']] = (int)($s['seasonNumber'] ?? 1);
        }

        // Sort episodes numerically by seasonNumber, then by episodeNumber
        usort($episodes, function($a, $b) use ($seasonNumberMap) {
            $aSeasonId = (string)($a['seasonId'] ?? '');
            $bSeasonId = (string)($b['seasonId'] ?? '');
            
            $aSeasonNum = $seasonNumberMap[$aSeasonId] ?? 0;
            $bSeasonNum = $seasonNumberMap[$bSeasonId] ?? 0;
            
            if ($aSeasonNum !== $bSeasonNum) {
                return $aSeasonNum <=> $bSeasonNum;
            }
            
            $aEpNum = (int)($a['episodeNumber'] ?? 0);
            $bEpNum = (int)($b['episodeNumber'] ?? 0);
            
            return $aEpNum <=> $bEpNum;
        });

        // Append subtitle count to each episode
        $episodeIds = array_map(function($ep) { return $ep['_id']; }, $episodes);
        if (!empty($episodeIds)) {
            $episodeSubtitles = $db->find('subtitles', [
                'mediaId' => ['$in' => $episodeIds]
            ]);
            $subsCountByMediaId = [];
            foreach($episodeSubtitles as $sub) {
                 $mid = (string)$sub['mediaId'];
                 if (!isset($subsCountByMediaId[$mid])) $subsCountByMediaId[$mid] = 0;
                 $subsCountByMediaId[$mid]++;
            }
            foreach($episodes as &$ep) {
                 $mid = (string)$ep['_id'];
                 $ep['subtitleCount'] = $subsCountByMediaId[$mid] ?? 0;
            }
        }

        // Fetch related dramas (excluding current, sharing keywords)
        $related = [];
        if (!empty($drama['keywords'])) {
            $related = $db->find('dramas', [
                '_id' => ['$ne' => $drama['_id']],
                'keywords' => ['$in' => $drama['keywords']]
            ], ['limit' => 4]);

            self::appendSubtitleSummariesToDramas($related);
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
            'cast' => array_map(function($c) { return is_array($c) ? ($c['name'] ?? '') : (is_string($c) ? $c : ''); }, $data['cast'] ?? [])
        ]);

        $finalDramaData = array_merge($data, $seoContent);
        $inserted = $db->insertOne('dramas', $finalDramaData);

        // Invalidate cache and trigger revalidation
        \Utils\Cache::delete('home_catalog');
        \Utils\Revalidate::path('/');
        if ($inserted && !empty($inserted['slug'])) {
            \Utils\Revalidate::media('drama', $inserted['slug']);
        }

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

        // Handle manual slug update - sanitize and ensure uniqueness
        if (!empty($updates['slug'])) {
            $newSlug = Slug::slugify($updates['slug']);
            $conflict = $db->findOne('dramas', ['slug' => $newSlug]);
            if ($conflict && (string)$conflict['_id'] !== (string)$id) {
                http_response_code(409);
                echo json_encode(['message' => "Slug '{$newSlug}' is already used by another drama."]);
                return;
            }
            $updates['slug'] = $newSlug;
        }

        // Re-generate SEO package if title or description changes
        if (!empty($updates['title']) || !empty($updates['description'])) {
            $title = $updates['title'] ?? $drama['title'];
            $desc = $updates['description'] ?? $drama['description'] ?? '';
            $seoContent = AiSeoController::generateSeoForTitle($title, $desc, 'Drama', [
                'genres' => $updates['keywords'] ?? $drama['keywords'] ?? [],
                'releaseDate' => $updates['releaseDate'] ?? $drama['releaseDate'] ?? null,
                'director' => $updates['director'] ?? $drama['director'] ?? '',
                'cast' => array_map(function($c) { return is_array($c) ? ($c['name'] ?? '') : (is_string($c) ? $c : ''); }, $updates['cast'] ?? $drama['cast'] ?? [])
            ]);
            $updates = array_merge($updates, $seoContent);
        }



        $db->updateOne('dramas', ['_id' => $id], $updates);
        $updatedDrama = $db->findOne('dramas', ['_id' => $id]);

        // Invalidate cache and trigger revalidation
        \Utils\Cache::delete('home_catalog');
        \Utils\Revalidate::path('/');
        if ($updatedDrama && !empty($updatedDrama['slug'])) {
            \Utils\Revalidate::media('drama', $updatedDrama['slug']);
        }

        header('Content-Type: application/json');
        echo json_encode(['message' => 'Drama updated successfully', 'drama' => $updatedDrama]);
    }

    public static function deleteDrama($id) {
        $db = Database::getInstance();
        $drama = $db->findOne('dramas', ['_id' => $id]);
        if (!$drama) {
            http_response_code(404);
            echo json_encode(['message' => 'Drama not found']);
            return;
        }

        $deleted = $db->deleteOne('dramas', ['_id' => $id]);
        if (!$deleted) {
            http_response_code(404);
            echo json_encode(['message' => 'Drama not found']);
            return;
        }

        // Delete cascading seasons and episodes
        $db->deleteMany('seasons', ['dramaId' => $id]);
        $db->deleteMany('episodes', ['dramaId' => $id]);

        // Invalidate cache and trigger revalidation
        \Utils\Cache::delete('home_catalog');
        \Utils\Revalidate::path('/');
        if ($drama && !empty($drama['slug'])) {
            \Utils\Revalidate::media('drama', $drama['slug']);
        }

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

        // Invalidate cache and trigger revalidation
        \Utils\Cache::delete('home_catalog');
        \Utils\Revalidate::path('/');
        $drama = $db->findOne('dramas', ['_id' => $dramaId]);
        if ($drama && !empty($drama['slug'])) {
            \Utils\Revalidate::media('drama', $drama['slug']);
        }

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

        // Invalidate cache and trigger revalidation
        \Utils\Cache::delete('home_catalog');
        \Utils\Revalidate::path('/');
        if ($season && !empty($season['dramaId'])) {
            $drama = $db->findOne('dramas', ['_id' => $season['dramaId']]);
            if ($drama && !empty($drama['slug'])) {
                \Utils\Revalidate::media('drama', $drama['slug']);
            }
        }

        header('Content-Type: application/json');
        echo json_encode(['message' => 'Season updated successfully', 'season' => $updated]);
    }

    public static function deleteSeason($id) {
        $db = Database::getInstance();
        $season = $db->findOne('seasons', ['_id' => $id]);
        if (!$season) {
            http_response_code(404);
            echo json_encode(['message' => 'Season not found']);
            return;
        }

        $deleted = $db->deleteOne('seasons', ['_id' => $id]);
        if (!$deleted) {
            http_response_code(404);
            echo json_encode(['message' => 'Season not found']);
            return;
        }

        // Cascade delete episodes
        $db->deleteMany('episodes', ['seasonId' => $id]);

        // Invalidate cache and trigger revalidation
        \Utils\Cache::delete('home_catalog');
        \Utils\Revalidate::path('/');
        if ($season && !empty($season['dramaId'])) {
            $drama = $db->findOne('dramas', ['_id' => $season['dramaId']]);
            if ($drama && !empty($drama['slug'])) {
                \Utils\Revalidate::media('drama', $drama['slug']);
            }
        }

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

        // Invalidate cache and trigger revalidation
        \Utils\Cache::delete('home_catalog');
        \Utils\Revalidate::path('/');
        if ($drama && !empty($drama['slug'])) {
            \Utils\Revalidate::media('drama', $drama['slug']);
        }

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

        // Invalidate cache and trigger revalidation
        \Utils\Cache::delete('home_catalog');
        \Utils\Revalidate::path('/');
        if ($episode && !empty($episode['dramaId'])) {
            $drama = $db->findOne('dramas', ['_id' => $episode['dramaId']]);
            if ($drama && !empty($drama['slug'])) {
                \Utils\Revalidate::media('drama', $drama['slug']);
            }
        }

        header('Content-Type: application/json');
        echo json_encode(['message' => 'Episode updated successfully', 'episode' => $updated]);
    }

    public static function deleteEpisode($id) {
        $db = Database::getInstance();
        $episode = $db->findOne('episodes', ['_id' => $id]);
        if (!$episode) {
            http_response_code(404);
            echo json_encode(['message' => 'Episode not found']);
            return;
        }

        $deleted = $db->deleteOne('episodes', ['_id' => $id]);
        if (!$deleted) {
            http_response_code(404);
            echo json_encode(['message' => 'Episode not found']);
            return;
        }

        // Invalidate cache and trigger revalidation
        \Utils\Cache::delete('home_catalog');
        \Utils\Revalidate::path('/');
        if ($episode && !empty($episode['dramaId'])) {
            $drama = $db->findOne('dramas', ['_id' => $episode['dramaId']]);
            if ($drama && !empty($drama['slug'])) {
                \Utils\Revalidate::media('drama', $drama['slug']);
            }
        }

        header('Content-Type: application/json');
        echo json_encode(['message' => 'Episode deleted successfully']);
    }

    public static function getSubtitleSummaryForDrama($dramaId) {
        $db = Database::getInstance();
        
        // 1. Get all episodes of the drama
        $episodes = $db->find('episodes', ['dramaId' => $dramaId]);
        $totalEpisodesCount = count($episodes);
        
        // 2. Get all approved subtitles for the drama itself
        $titleSubtitles = $db->find('subtitles', [
            'mediaId' => $dramaId,
            'approvalStatus' => 'Approved'
        ]);
        
        // 3. Get all approved subtitles for the episodes of the drama
        $episodeSubtitles = [];
        $episodeIds = array_map(function($ep) { return $ep['_id']; }, $episodes);
        if (!empty($episodeIds)) {
            $episodeSubtitles = $db->find('subtitles', [
                'mediaId' => ['$in' => $episodeIds],
                'approvalStatus' => 'Approved'
            ]);
        }
        
        $allSubtitles = array_merge($titleSubtitles, $episodeSubtitles);
        $totalSubtitles = count($allSubtitles);
        
        if ($totalSubtitles === 0) {
            return [
                'totalSubtitles' => 0,
                'languages' => [],
                'progressLabel' => 'No subs',
                'seasonStatus' => 'Ongoing',
                'latestUploaderRole' => null
            ];
        }
        
        // 4. Languages list
        $languages = [];
        $hasCompleteStatus = false;
        foreach ($allSubtitles as $sub) {
            if (!empty($sub['language']) && !in_array($sub['language'], $languages)) {
                $languages[] = $sub['language'];
            }
            if (isset($sub['seasonStatus']) && $sub['seasonStatus'] === 'Complete') {
                $hasCompleteStatus = true;
            }
        }
        usort($languages, function($a, $b) {
            if ($a === 'Sinhala') return -1;
            if ($b === 'Sinhala') return 1;
            return strcmp($a, $b);
        });
        
        // 5. Determine which episodes have subtitles
        $subbedEpisodes = [];
        foreach ($episodeSubtitles as $sub) {
            $epNum = isset($sub['episodeNumber']) ? (int)$sub['episodeNumber'] : null;
            if ($epNum !== null && !in_array($epNum, $subbedEpisodes)) {
                $subbedEpisodes[] = $epNum;
            }
        }
        
        foreach ($episodeSubtitles as $sub) {
            if (!isset($sub['episodeNumber']) || $sub['episodeNumber'] === null) {
                foreach ($episodes as $ep) {
                    if ($ep['_id'] === $sub['mediaId']) {
                        $epNum = (int)$ep['episodeNumber'];
                        if (!in_array($epNum, $subbedEpisodes)) {
                            $subbedEpisodes[] = $epNum;
                        }
                        break;
                    }
                }
            }
        }
        
        $subbedCount = count($subbedEpisodes);
        $maxEpisodeNumber = !empty($subbedEpisodes) ? max($subbedEpisodes) : 0;
        
        // Determine status
        // If episodes exist in DB → use actual episode count to determine completion (ignore manual flag)
        // If NO episodes in DB → fall back to manual seasonStatus flag on subtitle
        $seasonStatus = 'Ongoing';
        $progressLabel = '';

        $isComplete = ($totalEpisodesCount > 0 && $subbedCount >= $totalEpisodesCount)
                   || ($totalEpisodesCount === 0 && $hasCompleteStatus);

        if ($isComplete) {
            $seasonStatus = 'Complete';
            $progressLabel = 'Completed';
        } else {
            if ($totalEpisodesCount > 0) {
                // Show latest episode
                $progressLabel = 'EP ' . ($maxEpisodeNumber > 0 ? $maxEpisodeNumber : $subbedCount);
            } elseif ($maxEpisodeNumber > 0) {
                $progressLabel = 'Ep ' . str_pad($maxEpisodeNumber, 2, '0', STR_PAD_LEFT);
            } else {
                $progressLabel = $totalSubtitles . ' subs';
            }
        }

        // Get the latest approved subtitle's uploader role
        $latestUploaderRole = null;
        if (!empty($allSubtitles)) {
            usort($allSubtitles, function($a, $b) {
                $t1 = isset($a['createdAt']) ? strtotime($a['createdAt']) : 0;
                $t2 = isset($b['createdAt']) ? strtotime($b['createdAt']) : 0;
                return $t2 - $t1;
            });
            $latestUploaderRole = $allSubtitles[0]['uploaderRole'] ?? null;
        }
        
        return [
            'totalSubtitles' => $totalSubtitles,
            'languages' => $languages,
            'progressLabel' => $progressLabel,
            'seasonStatus' => $seasonStatus,
            'latestUploaderRole' => $latestUploaderRole
        ];
    }

    public static function appendSubtitleSummariesToDramas(&$dramas) {
        if (empty($dramas)) return;
        $db = Database::getInstance();
        $dramaIds = array_map(function($d) { return $d['_id']; }, $dramas);
        
        // 1. Get all episodes for all these dramas in a single query
        $episodes = $db->find('episodes', ['dramaId' => ['$in' => $dramaIds]]);
        $episodesByDrama = [];
        $episodeIds = [];
        foreach ($episodes as $ep) {
            $episodesByDrama[$ep['dramaId']][] = $ep;
            $episodeIds[] = $ep['_id'];
        }
        
        // 2. Get all approved subtitles for all these dramas in a single query
        $allSubtitles = $db->find('subtitles', [
            'mediaId' => ['$in' => array_merge($dramaIds, $episodeIds)],
            'approvalStatus' => 'Approved'
        ]);
        
        // Group subtitles by mediaId
        $subtitlesByMedia = [];
        foreach ($allSubtitles as $sub) {
            $subtitlesByMedia[$sub['mediaId']][] = $sub;
        }
        
        // 3. For each drama, compute the summary using the pre-fetched data
        foreach ($dramas as &$drama) {
            $dId = $drama['_id'];
            $dramaEps = $episodesByDrama[$dId] ?? [];
            $totalEpisodesCount = count($dramaEps);
            
            $titleSubbed = $subtitlesByMedia[$dId] ?? [];
            
            $epSubbed = [];
            $dramaEpIds = array_map(function($ep) { return $ep['_id']; }, $dramaEps);
            foreach ($dramaEpIds as $epId) {
                if (isset($subtitlesByMedia[$epId])) {
                    $epSubbed = array_merge($epSubbed, $subtitlesByMedia[$epId]);
                }
            }
            
            $dramaSubs = array_merge($titleSubbed, $epSubbed);
            $totalSubtitles = count($dramaSubs);
            
            if ($totalSubtitles === 0) {
                $drama['subtitleSummary'] = [
                    'totalSubtitles' => 0,
                    'languages' => [],
                    'progressLabel' => 'No subs',
                    'seasonStatus' => 'Ongoing',
                    'latestUploaderRole' => null
                ];
                continue;
            }
            
            $languages = [];
            $hasCompleteStatus = false;
            foreach ($dramaSubs as $sub) {
                if (!empty($sub['language']) && !in_array($sub['language'], $languages)) {
                    $languages[] = $sub['language'];
                }
                if (isset($sub['seasonStatus']) && $sub['seasonStatus'] === 'Complete') {
                    $hasCompleteStatus = true;
                }
            }
            usort($languages, function($a, $b) {
                if ($a === 'Sinhala') return -1;
                if ($b === 'Sinhala') return 1;
                return strcmp($a, $b);
            });
            
            $subbedEpisodes = [];
            foreach ($epSubbed as $sub) {
                $epNum = isset($sub['episodeNumber']) ? (int)$sub['episodeNumber'] : null;
                if ($epNum !== null && !in_array($epNum, $subbedEpisodes)) {
                    $subbedEpisodes[] = $epNum;
                }
            }
            
            foreach ($epSubbed as $sub) {
                if (!isset($sub['episodeNumber']) || $sub['episodeNumber'] === null) {
                    foreach ($dramaEps as $ep) {
                        if ($ep['_id'] === $sub['mediaId']) {
                            $epNum = (int)$ep['episodeNumber'];
                            if (!in_array($epNum, $subbedEpisodes)) {
                                $subbedEpisodes[] = $epNum;
                            }
                            break;
                        }
                    }
                }
            }
            
            $subbedCount = count($subbedEpisodes);
            $maxEpisodeNumber = !empty($subbedEpisodes) ? max($subbedEpisodes) : 0;
            
            $seasonStatus = 'Ongoing';
            $progressLabel = '';
            $isComplete = ($totalEpisodesCount > 0 && $subbedCount >= $totalEpisodesCount)
                       || ($totalEpisodesCount === 0 && $hasCompleteStatus);
                       
            if ($isComplete) {
                $seasonStatus = 'Complete';
                $progressLabel = 'Completed';
            } else {
                if ($totalEpisodesCount > 0) {
                    // Show latest episode
                    $progressLabel = 'EP ' . ($maxEpisodeNumber > 0 ? $maxEpisodeNumber : $subbedCount);
                } elseif ($maxEpisodeNumber > 0) {
                    $progressLabel = 'Ep ' . str_pad($maxEpisodeNumber, 2, '0', STR_PAD_LEFT);
                } else {
                    $progressLabel = $totalSubtitles . ' subs';
                }
            }
            
            $latestUploaderRole = null;
            if (!empty($dramaSubs)) {
                usort($dramaSubs, function($a, $b) {
                    $t1 = isset($a['createdAt']) ? strtotime($a['createdAt']) : 0;
                    $t2 = isset($b['createdAt']) ? strtotime($b['createdAt']) : 0;
                    return $t2 - $t1;
                });
                $latestUploaderRole = $dramaSubs[0]['uploaderRole'] ?? null;
            }
            
            $drama['subtitleSummary'] = [
                'totalSubtitles' => $totalSubtitles,
                'languages' => $languages,
                'progressLabel' => $progressLabel,
                'seasonStatus' => $seasonStatus,
                'latestUploaderRole' => $latestUploaderRole
            ];
        }
    }
}
