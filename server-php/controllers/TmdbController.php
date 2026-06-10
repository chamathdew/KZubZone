<?php
namespace Controllers;

use Config\Database;
use Utils\Slug;

class TmdbController {
    // Standard mock data mirroring tmdbController.js
    private static $mockData = [
        'movies' => [
            [
                'id' => 555501,
                'title' => "Train to Busan",
                'original_title' => "부산행",
                'overview' => "A zombie virus breaks out in South Korea, and passengers on a train from Seoul to Busan struggle to survive the outbreak.",
                'genres' => [['id' => 27, 'name' => "Horror"], ['id' => 28, 'name' => "Action"], ['id' => 53, 'name' => "Thriller"]],
                'poster_path' => "/v5195.jpg",
                'backdrop_path' => "/b195.jpg",
                'release_date' => "2016-07-20",
                'runtime' => 118,
                'origin_country' => ["KR"],
                'original_language' => "ko",
                'production_companies' => [['name' => "RedPeter Films"], ['name' => "Next Entertainment World"]],
                'vote_average' => 8.0,
                'keywords' => ["zombie", "survival", "train", "father daughter relationship"],
                'trailer' => "https://www.youtube.com/embed/pyWuHv2-Y8s",
                'director' => "Yeon Sang-ho",
                'writers' => ["Park Joo-suk", "Yeon Sang-ho"],
                'cast' => [
                    ['name' => "Gong Yoo", 'character' => "Seok-woo", 'profilePath' => ""],
                    ['name' => "Ma Dong-seok", 'character' => "Sang-hwa", 'profilePath' => ""],
                    ['name' => "Jung Yu-mi", 'character' => "Seong-kyeong", 'profilePath' => ""]
                ],
                'crew' => [['name' => "Yeon Sang-ho", 'job' => "Director"]],
                'images' => [],
                'studio' => "RedPeter Films"
            ],
            [
                'id' => 555502,
                'title' => "Parasite",
                'original_title' => "기생충",
                'overview' => "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.",
                'genres' => [['id' => 35, 'name' => "Comedy"], ['id' => 53, 'name' => "Thriller"], ['id' => 18, 'name' => "Drama"]],
                'poster_path' => "/parasite_poster.jpg",
                'backdrop_path' => "/parasite_back.jpg",
                'release_date' => "2019-05-30",
                'runtime' => 132,
                'origin_country' => ["KR"],
                'original_language' => "ko",
                'production_companies' => [['name' => "Barunson E&A"]],
                'vote_average' => 8.5,
                'keywords' => ["social commentary", "class conflict", "dark comedy", "scam"],
                'trailer' => "https://www.youtube.com/embed/5xH0HfJHsaY",
                'director' => "Bong Joon-ho",
                'writers' => ["Bong Joon-ho", "Han Jin-won"],
                'cast' => [
                    ['name' => "Song Kang-ho", 'character' => "Ki-taek", 'profilePath' => ""],
                    ['name' => "Lee Sun-kyun", 'character' => "Mr. Park", 'profilePath' => ""],
                    ['name' => "Cho Yeo-jeong", 'character' => "Mrs. Park", 'profilePath' => ""]
                ],
                'crew' => [['name' => "Bong Joon-ho", 'job' => "Director"]],
                'images' => [],
                'studio' => "Barunson E&A"
            ]
        ],
        'dramas' => [
            [
                'id' => 999901,
                'name' => "Moving",
                'original_name' => "무빙",
                'overview' => "Children with superpowers and their parents who harbor painful secrets from the past face a massive imminent danger together.",
                'genres' => [['id' => 10759, 'name' => "Action & Adventure"], ['id' => 18, 'name' => "Drama"], ['id' => 9648, 'name' => "Mystery"]],
                'poster_path' => "/moving_poster.jpg",
                'backdrop_path' => "/moving_back.jpg",
                'first_air_date' => "2023-08-09",
                'episode_run_time' => [45],
                'origin_country' => ["KR"],
                'original_language' => "ko",
                'production_companies' => [['name' => "Studio Flow"], ['name' => "Mr. Romance"]],
                'vote_average' => 8.4,
                'keywords' => ["superpowers", "secret agent", "family", "high school"],
                'trailer' => "https://www.youtube.com/embed/rP1Zc5b_a6E",
                'director' => "Park In-je",
                'writers' => ["Kang Full"],
                'cast' => [
                    ['name' => "Ryu Seung-ryong", 'character' => "Jang Ju-won", 'profilePath' => ""],
                    ['name' => "Han Hyo-joo", 'character' => "Lee Mi-hyun", 'profilePath' => ""],
                    ['name' => "Zo In-sung", 'character' => "Kim Doo-shik", 'profilePath' => ""]
                ],
                'crew' => [['name' => "Park In-je", 'job' => "Director"]],
                'images' => [],
                'studio' => "Studio Flow",
                'seasons' => [
                    [
                        'season_number' => 1,
                        'overview' => "Season 1 chronicles the awakening of high schoolers' abilities and the agents guarding them.",
                        'poster_path' => "/moving_s1_poster.jpg",
                        'air_date' => "2023-08-09",
                        'episodes' => [
                            ['episode_number' => 1, 'name' => "Superpower Senior", 'overview' => "Bong-seok hides his ability to float. A new girl, Hui-soo, transfers to his school.", 'air_date' => "2023-08-09", 'runtime' => 45],
                            ['episode_number' => 2, 'name' => "Han River Euljiro", 'overview' => "A mysterious assassin named Frank begins targeting retired agents with superpowers.", 'air_date' => "2023-08-09", 'runtime' => 48]
                        ]
                    ]
                ]
            ],
            [
                'id' => 999902,
                'name' => "Goblin",
                'original_name' => "쓸쓸하고 찬란하神-도깨비",
                'overview' => "An immortal goblin needs a human bride to end his life. He crosses paths with a grim reaper and a girl who claims she is the goblin's bride.",
                'genres' => [['id' => 18, 'name' => "Drama"], ['id' => 10765, 'name' => "Sci-Fi & Fantasy"]],
                'poster_path' => "/goblin_poster.jpg",
                'backdrop_path' => "/goblin_back.jpg",
                'first_air_date' => "2016-12-02",
                'episode_run_time' => [75],
                'origin_country' => ["KR"],
                'original_language' => "ko",
                'production_companies' => [['name' => "Studio Dragon"]],
                'vote_average' => 8.7,
                'keywords' => ["goblin", "grim reaper", "reincarnation", "immortality", "romance"],
                'trailer' => "https://www.youtube.com/embed/8AcQ-5Fv6Qc",
                'director' => "Lee Eung-bok",
                'writers' => ["Kim Eun-sook"],
                'cast' => [
                    ['name' => "Gong Yoo", 'character' => "Kim Shin (Goblin)", 'profilePath' => ""],
                    ['name' => "Kim Go-eun", 'character' => "Ji Eun-tak", 'profilePath' => ""],
                    ['name' => "Lee Dong-wook", 'character' => "Grim Reaper", 'profilePath' => ""]
                ],
                'crew' => [['name' => "Lee Eung-bok", 'job' => "Director"]],
                'images' => [],
                'studio' => "Studio Dragon",
                'seasons' => [
                    [
                        'season_number' => 1,
                        'overview' => "Follow the romantic and tragic tale of goblin Kim Shin and Eun-tak.",
                        'poster_path' => "/goblin_s1_poster.jpg",
                        'air_date' => "2016-12-02",
                        'episodes' => [
                            ['episode_number' => 1, 'name' => "The Goblin's Bride", 'overview' => "Kim Shin, cursed with immortality, wanders the Earth. Eun-tak summons him accidentally.", 'air_date' => "2016-12-02", 'runtime' => 75]
                        ]
                    ]
                ]
            ]
        ]
    ];

    private static function httpGet($url, $params = []) {
        $queryString = http_build_query($params);
        $fullUrl = $url . ($queryString ? '?' . $queryString : '');

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $fullUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For localhost Dev environments
        
        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true);
    }

    private static function getTmdbApiKey() {
        if (!empty($_ENV['TMDB_API_KEY'])) {
            return trim($_ENV['TMDB_API_KEY']);
        }
        
        $db = Database::getInstance();
        $setting = $db->findOne('settings', ['key' => ['$in' => ['TMDB_API_KEY', 'tmdb_api_key', 'tmdb'] ] ]);
        if ($setting && !empty($setting['value'])) {
            return trim($setting['value']);
        }
        return '';
    }

    public static function searchTmdb() {
        $query = $_GET['query'] ?? '';
        $type = $_GET['type'] ?? 'movie'; // movie or tv

        if (empty($query)) {
            http_response_code(400);
            echo json_encode(['message' => 'Search query is required']);
            return;
        }

        $apiKey = self::getTmdbApiKey();
        header('Content-Type: application/json');

        if (!empty($apiKey)) {
            $endpoint = ($type === 'tv') ? 'search/tv' : 'search/movie';
            $url = "https://api.themoviedb.org/3/{$endpoint}";
            $res = self::httpGet($url, [
                'api_key' => $apiKey,
                'query' => $query,
                'language' => 'en-US'
            ]);

            $results = [];
            if (isset($res['results'])) {
                foreach ($res['results'] as $item) {
                    $results[] = [
                        'id' => $item['id'],
                        'title' => $item['title'] ?? ($item['name'] ?? ''),
                        'original_title' => $item['original_title'] ?? ($item['original_name'] ?? ''),
                        'overview' => $item['overview'] ?? '',
                        'poster_path' => $item['poster_path'] ?? null,
                        'backdrop_path' => $item['backdrop_path'] ?? null,
                        'release_date' => $item['release_date'] ?? ($item['first_air_date'] ?? null),
                        'vote_average' => $item['vote_average'] ?? 0
                    ];
                }
            }
            echo json_encode($results);
        } else {
            // Mock fallback search
            $store = ($type === 'tv') ? self::$mockData['dramas'] : self::$mockData['movies'];
            $results = [];
            foreach ($store as $item) {
                $title = $item['title'] ?? ($item['name'] ?? '');
                $originalTitle = $item['original_title'] ?? ($item['original_name'] ?? '');
                if (stripos($title, $query) !== false || stripos($originalTitle, $query) !== false) {
                    $results[] = [
                        'id' => $item['id'],
                        'title' => $title,
                        'original_title' => $originalTitle,
                        'overview' => $item['overview'],
                        'poster_path' => $item['poster_path'] ?? null,
                        'backdrop_path' => $item['backdrop_path'] ?? null,
                        'release_date' => $item['release_date'] ?? ($item['first_air_date'] ?? null),
                        'vote_average' => $item['vote_average'],
                        'isMock' => true
                    ];
                }
            }
            echo json_encode($results);
        }
    }

    public static function importFromTmdb() {
        $body = json_decode(file_get_contents('php://input'), true) ?: [];
        $id = $body['id'] ?? null;
        $type = $body['type'] ?? 'movie'; // movie or tv
        $isHistorical = (bool)($body['isHistorical'] ?? false);

        if (!$id) {
            http_response_code(400);
            echo json_encode(['message' => 'TMDB ID is required']);
            return;
        }

        $apiKey = self::getTmdbApiKey();
        $data = null;

        if (!empty($apiKey)) {
            $endpoint = ($type === 'tv') ? 'tv' : 'movie';
            $url = "https://api.themoviedb.org/3/{$endpoint}/{$id}";
            $data = self::httpGet($url, [
                'api_key' => $apiKey,
                'append_to_response' => 'credits,videos,images,keywords'
            ]);

            if (isset($data['success']) && $data['success'] === false) {
                http_response_code(404);
                echo json_encode(['message' => 'Media not found on TMDB']);
                return;
            }

            // Extract keywords
            $keywordsArr = [];
            if (isset($data['keywords']['keywords'])) {
                foreach ($data['keywords']['keywords'] as $k) {
                    $keywordsArr[] = $k['name'];
                }
            } elseif (isset($data['keywords']['results'])) {
                foreach ($data['keywords']['results'] as $k) {
                    $keywordsArr[] = $k['name'];
                }
            }
            $data['keywords'] = $keywordsArr;

            // Extract trailer URL
            $trailerUrl = '';
            if (isset($data['videos']['results'])) {
                foreach ($data['videos']['results'] as $v) {
                    if ($v['type'] === 'Trailer' && $v['site'] === 'YouTube') {
                        $trailerUrl = "https://www.youtube.com/embed/{$v['key']}";
                        break;
                    }
                }
            }
            $data['trailer'] = $trailerUrl;

            // Extract images
            $imgArr = [];
            if (isset($data['images']['backdrops'])) {
                $backdrops = array_slice($data['images']['backdrops'], 0, 5);
                foreach ($backdrops as $i) {
                    $imgArr[] = "https://image.tmdb.org/t/p/original" . $i['file_path'];
                }
            }
            $data['images'] = $imgArr;

            // Fetch seasons if tv
            if ($type === 'tv' && isset($data['seasons'])) {
                $seasonsFull = [];
                foreach ($data['seasons'] as $s) {
                    if (($s['season_number'] ?? 0) === 0) continue; // Skip specials
                    $sUrl = "https://api.themoviedb.org/3/tv/{$id}/season/{$s['season_number']}";
                    $seasonDetails = self::httpGet($sUrl, ['api_key' => $apiKey]);
                    if ($seasonDetails) {
                        $seasonsFull[] = $seasonDetails;
                    }
                }
                $data['seasons'] = $seasonsFull;
            }
        } else {
            // Mock Import mapping
            $store = ($type === 'tv') ? self::$mockData['dramas'] : self::$mockData['movies'];
            foreach ($store as $item) {
                if ((int)$item['id'] === (int)$id) {
                    $data = $item;
                    break;
                }
            }

            if (!$data) {
                http_response_code(404);
                echo json_encode(['message' => 'Mock title details not found in fallback database.']);
                return;
            }
        }

        $db = Database::getInstance();
        header('Content-Type: application/json');

        if ($type === 'tv') {
            $media = self::processDramaData($data, $isHistorical);
            echo json_encode(['message' => 'Drama imported successfully', 'media' => $media]);
        } else {
            $media = self::processMovieData($data, $isHistorical);
            echo json_encode(['message' => 'Movie imported successfully', 'media' => $media]);
        }
    }

    private static function processMovieData($data, $isHistorical = false) {
        $db = Database::getInstance();

        // Save genres
        $genresList = [];
        if (isset($data['genres'])) {
            foreach ($data['genres'] as $g) {
                $genresList[] = $g['name'];
                $existingGenre = $db->findOne('genres', ['name' => $g['name']]);
                if (!$existingGenre) {
                    $db->insertOne('genres', [
                        'name' => $g['name'],
                        'slug' => Slug::slugify($g['name']),
                        'tmdbId' => $g['id']
                    ]);
                }
            }
        }

        $existingMovie = $db->findOne('movies', ['tmdbId' => $data['id']]);
        // Strip trailing year patterns like "Movie Title 2026" or "Movie Title (2026)" from slug
        $slugTitle = preg_replace('/\s*[\(\[]?\d{4}[\)\]]?\s*$/', '', $data['title']);
        $slug = Slug::createUniqueSlug(function($candidate) use ($db) {
            return $db->findOne('movies', ['slug' => $candidate]);
        }, $slugTitle ?: $data['title'], $existingMovie['_id'] ?? null);

        $director = $data['director'] ?? '';
        $writers = $data['writers'] ?? [];
        $cast = [];

        if (empty($director) && isset($data['credits']['crew'])) {
            foreach ($data['credits']['crew'] as $c) {
                if ($c['job'] === 'Director') {
                    $director = $c['name'];
                    break;
                }
            }
        }

        if (empty($writers) && isset($data['credits']['crew'])) {
            foreach ($data['credits']['crew'] as $c) {
                if ($c['department'] === 'Writing') {
                    $writers[] = $c['name'];
                }
            }
        }

        if (isset($data['credits']['cast'])) {
            $rawCast = array_slice($data['credits']['cast'], 0, 10);
            foreach ($rawCast as $c) {
                $cast[] = [
                    'name' => $c['name'],
                    'character' => $c['character'],
                    'profilePath' => $c['profile_path'] ? "https://image.tmdb.org/t/p/w185" . $c['profile_path'] : ''
                ];
            }
        } else {
            $cast = $data['cast'] ?? [];
        }

        $movieDoc = [
            'title' => $data['title'],
            'originalTitle' => $data['original_title'] ?? $data['title'],
            'slug' => $slug,
            'description' => $data['overview'],
            'poster' => !empty($data['poster_path']) ? "https://image.tmdb.org/t/p/w500" . $data['poster_path'] : 'https://placehold.co/500x750/111/fff?text=No+Poster',
            'banner' => !empty($data['backdrop_path']) ? "https://image.tmdb.org/t/p/original" . $data['backdrop_path'] : 'https://placehold.co/1920x1080/111/fff?text=No+Banner',
            'backdrops' => !empty($data['backdrop_path']) ? ["https://image.tmdb.org/t/p/original" . $data['backdrop_path']] : [],
            'releaseDate' => $data['release_date'] ?? null,
            'runtime' => $data['runtime'] ?? 120,
            'country' => isset($data['origin_country'][0]) ? $data['origin_country'][0] : 'KR',
            'language' => $data['original_language'] ?? 'ko',
            'productionCompanies' => array_map(function($c) { return $c['name']; }, $data['production_companies'] ?? []),
            'tmdbRating' => $data['vote_average'] ?? 0,
            'imdbRating' => $data['vote_average'] ?? 0,
            'trailer' => $data['trailer'] ?? '',
            'keywords' => $data['keywords'] ?? [],
            'images' => $data['images'] ?? [],
            'director' => $director,
            'writers' => $writers,
            'studio' => $data['studio'] ?? ($data['production_companies'][0]['name'] ?? 'Unknown Studio'),
            'cast' => $cast,
            'tmdbId' => $data['id'],
            'status' => 'Published',
            'isHistorical' => $isHistorical
        ];

        // AI SEO content
        $seo = AiSeoController::generateSeoForTitle($movieDoc['title'], $movieDoc['description'], 'Movie', [
            'genres' => $genresList,
            'releaseDate' => $movieDoc['releaseDate'],
            'director' => $movieDoc['director'],
            'cast' => array_map(function($c) { return $c['name']; }, $movieDoc['cast'])
        ]);

        $finalDoc = array_merge($movieDoc, $seo);

        if ($existingMovie) {
            $db->updateOne('movies', ['_id' => $existingMovie['_id']], $finalDoc);
            return $db->findOne('movies', ['_id' => $existingMovie['_id']]);
        } else {
            return $db->insertOne('movies', $finalDoc);
        }
    }

    private static function processDramaData($data, $isHistorical = false) {
        $db = Database::getInstance();

        // Save genres
        $genresList = [];
        if (isset($data['genres'])) {
            foreach ($data['genres'] as $g) {
                $genresList[] = $g['name'];
                $existingGenre = $db->findOne('genres', ['name' => $g['name']]);
                if (!$existingGenre) {
                    $db->insertOne('genres', [
                        'name' => $g['name'],
                        'slug' => Slug::slugify($g['name']),
                        'tmdbId' => $g['id']
                    ]);
                }
            }
        }

        $existingDrama = $db->findOne('dramas', ['tmdbId' => $data['id']]);
        // Strip trailing year patterns like "Drama Title 2026" or "Drama Title (2026)" from slug
        $slugTitle = preg_replace('/\s*[\(\[]?\d{4}[\)\]]?\s*$/', '', $data['name']);
        $slug = Slug::createUniqueSlug(function($candidate) use ($db) {
            return $db->findOne('dramas', ['slug' => $candidate]);
        }, $slugTitle ?: $data['name'], $existingDrama['_id'] ?? null);

        $director = $data['director'] ?? '';
        $writers = $data['writers'] ?? [];
        $cast = [];

        if (empty($director) && isset($data['credits']['crew'])) {
            foreach ($data['credits']['crew'] as $c) {
                if ($c['job'] === 'Director') {
                    $director = $c['name'];
                    break;
                }
            }
        }

        if (empty($writers) && isset($data['credits']['crew'])) {
            foreach ($data['credits']['crew'] as $c) {
                if ($c['department'] === 'Writing') {
                    $writers[] = $c['name'];
                }
            }
        }

        if (isset($data['credits']['cast'])) {
            $rawCast = array_slice($data['credits']['cast'], 0, 10);
            foreach ($rawCast as $c) {
                $cast[] = [
                    'name' => $c['name'],
                    'character' => $c['character'],
                    'profilePath' => $c['profile_path'] ? "https://image.tmdb.org/t/p/w185" . $c['profile_path'] : ''
                ];
            }
        } else {
            $cast = $data['cast'] ?? [];
        }

        $dramaDoc = [
            'title' => $data['name'],
            'originalTitle' => $data['original_name'] ?? $data['name'],
            'slug' => $slug,
            'description' => $data['overview'],
            'poster' => !empty($data['poster_path']) ? "https://image.tmdb.org/t/p/w500" . $data['poster_path'] : 'https://placehold.co/500x750/111/fff?text=No+Poster',
            'banner' => !empty($data['backdrop_path']) ? "https://image.tmdb.org/t/p/original" . $data['backdrop_path'] : 'https://placehold.co/1920x1080/111/fff?text=No+Banner',
            'backdrops' => !empty($data['backdrop_path']) ? ["https://image.tmdb.org/t/p/original" . $data['backdrop_path']] : [],
            'releaseDate' => $data['first_air_date'] ?? null,
            'runtime' => isset($data['episode_run_time'][0]) ? $data['episode_run_time'][0] : 60,
            'country' => isset($data['origin_country'][0]) ? $data['origin_country'][0] : 'KR',
            'language' => $data['original_language'] ?? 'ko',
            'productionCompanies' => array_map(function($c) { return $c['name']; }, $data['production_companies'] ?? []),
            'tmdbRating' => $data['vote_average'] ?? 0,
            'imdbRating' => $data['vote_average'] ?? 0,
            'trailer' => $data['trailer'] ?? '',
            'keywords' => $data['keywords'] ?? [],
            'images' => $data['images'] ?? [],
            'director' => $director,
            'writers' => $writers,
            'studio' => $data['studio'] ?? ($data['production_companies'][0]['name'] ?? 'Unknown Studio'),
            'cast' => $cast,
            'tmdbId' => $data['id'],
            'status' => 'Published',
            'isHistorical' => $isHistorical
        ];

        // AI SEO Content
        $seo = AiSeoController::generateSeoForTitle($dramaDoc['title'], $dramaDoc['description'], 'Drama', [
            'genres' => $genresList,
            'releaseDate' => $dramaDoc['releaseDate'],
            'director' => $dramaDoc['director'],
            'cast' => array_map(function($c) { return $c['name']; }, $dramaDoc['cast'])
        ]);

        $finalDoc = array_merge($dramaDoc, $seo);

        if ($existingDrama) {
            $db->updateOne('dramas', ['_id' => $existingDrama['_id']], $finalDoc);
            $drama = $db->findOne('dramas', ['_id' => $existingDrama['_id']]);
        } else {
            $drama = $db->insertOne('dramas', $finalDoc);
        }

        // Handle Seasons & Episodes import
        if (isset($data['seasons']) && is_array($data['seasons'])) {
            foreach ($data['seasons'] as $s) {
                $seasonDoc = [
                    'dramaId' => $drama['_id'],
                    'seasonNumber' => $s['season_number'],
                    'seasonDescription' => $s['overview'] ?? "Season {$s['season_number']} of {$drama['title']}",
                    'seasonPoster' => $s['poster_path'] ? "https://image.tmdb.org/t/p/w500" . $s['poster_path'] : $drama['poster'],
                    'airDate' => $s['air_date'] ?? null
                ];

                $existingSeason = $db->findOne('seasons', [
                    'dramaId' => $drama['_id'],
                    'seasonNumber' => $s['season_number']
                ]);

                if ($existingSeason) {
                    $db->updateOne('seasons', ['_id' => $existingSeason['_id']], $seasonDoc);
                    $season = $db->findOne('seasons', ['_id' => $existingSeason['_id']]);
                } else {
                    $season = $db->insertOne('seasons', $seasonDoc);
                }

                // Add episodes
                if (isset($s['episodes']) && is_array($s['episodes'])) {
                    foreach ($s['episodes'] as $ep) {
                        $epSchema = [
                            "@context" => "https://schema.org",
                            "@type" => "TVEpisode",
                            "name" => $ep['name'],
                            "episodeNumber" => $ep['episode_number'],
                            "description" => $ep['overview'] ?? "Episode {$ep['episode_number']} of {$drama['title']} Season {$s['season_number']}",
                            "datePublished" => $ep['air_date'] ?? null
                        ];

                        $episodeDoc = [
                            'dramaId' => $drama['_id'],
                            'seasonId' => $season['_id'],
                            'episodeNumber' => $ep['episode_number'],
                            'episodeTitle' => $ep['name'] ?? "Episode {$ep['episode_number']}",
                            'episodeDescription' => $ep['overview'] ?? "Episode {$ep['episode_number']} of Season {$s['season_number']}",
                            'episodeThumbnail' => $drama['banner'],
                            'airDate' => $ep['air_date'] ?? null,
                            'runtime' => $ep['runtime'] ?? $drama['runtime'],
                            'videoUrl' => 'https://www.w3schools.com/html/mov_bbb.mp4',
                            'aiEpisodeSummary' => "AI generated recap for {$drama['title']} Episode {$ep['episode_number']}: " . ($ep['overview'] ?? ''),
                            'episodeSchemaMarkup' => $epSchema
                        ];

                        $existingEpisode = $db->findOne('episodes', [
                            'seasonId' => $season['_id'],
                            'episodeNumber' => $ep['episode_number']
                        ]);

                        if ($existingEpisode) {
                            $db->updateOne('episodes', ['_id' => $existingEpisode['_id']], $episodeDoc);
                        } else {
                            $db->insertOne('episodes', $episodeDoc);
                        }
                    }
                }
            }
        }

        return $drama;
    }

    public static function discoverKoreanDramas() {
        $source = $_GET['source'] ?? 'popular';
        $page = (int)($_GET['page'] ?? 1);

        $discoverConfigs = [
            'popular' => [
                'label' => 'Popular Korean Dramas',
                'endpoint' => 'discover/tv',
                'params' => [
                    'sort_by' => 'popularity.desc',
                    'with_origin_country' => 'KR',
                    'with_original_language' => 'ko'
                ]
            ],
            'top_rated' => [
                'label' => 'Top Rated Korean Dramas',
                'endpoint' => 'discover/tv',
                'params' => [
                    'sort_by' => 'vote_average.desc',
                    'vote_count_gte' => 80,
                    'with_origin_country' => 'KR',
                    'with_original_language' => 'ko'
                ]
            ],
            'latest' => [
                'label' => 'Latest Korean Dramas',
                'endpoint' => 'discover/tv',
                'params' => [
                    'sort_by' => 'first_air_date.desc',
                    'with_origin_country' => 'KR',
                    'with_original_language' => 'ko'
                ]
            ],
            'trending' => [
                'label' => 'Trending Korean Dramas',
                'endpoint' => 'trending/tv/week',
                'params' => []
            ],
            'airing' => [
                'label' => 'Currently Airing Korean Dramas',
                'endpoint' => 'tv/on_the_air',
                'params' => []
            ]
        ];

        $config = $discoverConfigs[$source] ?? $discoverConfigs['popular'];
        $apiKey = self::getTmdbApiKey();
        header('Content-Type: application/json');

        if (empty($apiKey)) {
            // Mock fallback
            $results = [];
            foreach (self::$mockData['dramas'] as $item) {
                $results[] = [
                    'id' => $item['id'],
                    'title' => $item['name'],
                    'original_title' => $item['original_name'],
                    'overview' => $item['overview'],
                    'poster_path' => $item['poster_path'],
                    'backdrop_path' => $item['backdrop_path'],
                    'release_date' => $item['first_air_date'],
                    'vote_average' => $item['vote_average'],
                    'media_type' => 'tv',
                    'source' => 'TMDB',
                    'isMock' => true
                ];
            }

            echo json_encode([
                'source' => $source,
                'label' => $config['label'] . ' (Mock fallback)',
                'page' => 1,
                'totalPages' => 1,
                'results' => $results
            ]);
            return;
        }

        $params = array_merge([
            'api_key' => $apiKey,
            'language' => 'en-US',
            'page' => $page
        ], $config['params']);

        if ($source === 'latest') {
            $params['first_air_date.lte'] = date('Y-m-d');
        }

        $url = "https://api.themoviedb.org/3/{$config['endpoint']}";
        $res = self::httpGet($url, $params);
        $results = $res['results'] ?? [];

        // Filter trending/airing for Korean dramas specifically
        if (in_array($source, ['trending', 'airing'])) {
            $filtered = [];
            foreach ($results as $item) {
                $originCountry = $item['origin_country'] ?? [];
                $originalLanguage = $item['original_language'] ?? '';
                if (in_array('KR', $originCountry) || $originalLanguage === 'ko') {
                    $filtered[] = $item;
                }
            }
            $results = $filtered;
        }

        $normalized = [];
        foreach ($results as $item) {
            $normalized[] = [
                'id' => $item['id'],
                'title' => $item['title'] ?? ($item['name'] ?? ''),
                'original_title' => $item['original_title'] ?? ($item['original_name'] ?? ''),
                'overview' => $item['overview'] ?? '',
                'poster_path' => $item['poster_path'] ?? null,
                'backdrop_path' => $item['backdrop_path'] ?? null,
                'release_date' => $item['release_date'] ?? ($item['first_air_date'] ?? null),
                'vote_average' => $item['vote_average'] ?? 0,
                'media_type' => 'tv',
                'source' => 'TMDB'
            ];
        }

        echo json_encode([
            'source' => $source,
            'label' => $config['label'],
            'page' => $res['page'] ?? $page,
            'totalPages' => $res['total_pages'] ?? 1,
            'results' => $normalized
        ]);
    }

    public static function bulkImportFromTmdb() {
        $body = json_decode(file_get_contents('php://input'), true) ?: [];
        $ids = $body['ids'] ?? [];
        $type = $body['type'] ?? 'tv'; // movie or tv
        $isHistorical = (bool)($body['isHistorical'] ?? false);

        $uniqueIds = array_slice(array_filter(array_unique(array_map('intval', $ids))), 0, 20);

        if (empty($uniqueIds)) {
            http_response_code(400);
            echo json_encode(['message' => 'Select at least one TMDB title to import']);
            return;
        }

        $imported = [];
        $failed = [];

        foreach ($uniqueIds as $id) {
            try {
                $apiKey = self::getTmdbApiKey();
                $data = null;

                if (!empty($apiKey)) {
                    $endpoint = ($type === 'tv') ? 'tv' : 'movie';
                    $url = "https://api.themoviedb.org/3/{$endpoint}/{$id}";
                    $data = self::httpGet($url, [
                        'api_key' => $apiKey,
                        'append_to_response' => 'credits,videos,images,keywords'
                    ]);

                    if (isset($data['success']) && $data['success'] === false) {
                        throw new \Exception('Media not found on TMDB');
                    }

                    // Extract keywords, trailer, images, and seasons details
                    $keywordsArr = [];
                    if (isset($data['keywords']['keywords'])) {
                        foreach ($data['keywords']['keywords'] as $k) {
                            $keywordsArr[] = $k['name'];
                        }
                    } elseif (isset($data['keywords']['results'])) {
                        foreach ($data['keywords']['results'] as $k) {
                            $keywordsArr[] = $k['name'];
                        }
                    }
                    $data['keywords'] = $keywordsArr;

                    $trailerUrl = '';
                    if (isset($data['videos']['results'])) {
                        foreach ($data['videos']['results'] as $v) {
                            if ($v['type'] === 'Trailer' && $v['site'] === 'YouTube') {
                                $trailerUrl = "https://www.youtube.com/embed/{$v['key']}";
                                break;
                            }
                        }
                    }
                    $data['trailer'] = $trailerUrl;

                    $imgArr = [];
                    if (isset($data['images']['backdrops'])) {
                        $backdrops = array_slice($data['images']['backdrops'], 0, 5);
                        foreach ($backdrops as $i) {
                            $imgArr[] = "https://image.tmdb.org/t/p/original" . $i['file_path'];
                        }
                    }
                    $data['images'] = $imgArr;

                    if ($type === 'tv' && isset($data['seasons'])) {
                        $seasonsFull = [];
                        foreach ($data['seasons'] as $s) {
                            if (($s['season_number'] ?? 0) === 0) continue;
                            $sUrl = "https://api.themoviedb.org/3/tv/{$id}/season/{$s['season_number']}";
                            $seasonDetails = self::httpGet($sUrl, ['api_key' => $apiKey]);
                            if ($seasonDetails) {
                                $seasonsFull[] = $seasonDetails;
                            }
                        }
                        $data['seasons'] = $seasonsFull;
                    }
                } else {
                    // Fallback to mock data store
                    $store = ($type === 'tv') ? self::$mockData['dramas'] : self::$mockData['movies'];
                    foreach ($store as $item) {
                        if ((int)$item['id'] === (int)$id) {
                            $data = $item;
                            break;
                        }
                    }

                    if (!$data) {
                        throw new \Exception('Mock title details not found in fallback database.');
                    }
                }

                if ($type === 'tv') {
                    $media = self::processDramaData($data, $isHistorical);
                    $title = $media['title'] ?? ($media['name'] ?? "TMDB {$id}");
                } else {
                    $media = self::processMovieData($data, $isHistorical);
                    $title = $media['title'] ?? ($media['name'] ?? "TMDB {$id}");
                }

                $imported[] = [
                    'id' => $id,
                    'title' => $title,
                    'message' => 'Imported successfully'
                ];
            } catch (\Exception $e) {
                $failed[] = [
                    'id' => $id,
                    'message' => $e->getMessage()
                ];
            }
        }

        header('Content-Type: application/json');
        echo json_encode([
            'message' => "Bulk import complete: " . count($imported) . " imported, " . count($failed) . " failed",
            'imported' => $imported,
            'failed' => $failed
        ]);
    }
}
