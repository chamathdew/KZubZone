<?php
namespace Controllers;

use Utils\AiService;
use Config\Database;

class AiController {
    
    // 1. AI Chatbot
    public static function chat() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            return;
        }

        $body = json_decode(file_get_contents('php://input'), true);
        $message = $body['message'] ?? '';
        $history = $body['history'] ?? [];

        if (empty($message)) {
            http_response_code(400);
            echo json_encode(['error' => 'Message is required']);
            return;
        }

        $systemPrompt = "You are 'KSubZone AI', a friendly and knowledgeable Korean Drama and Movie assistant. 
You speak mostly in friendly Singlish (Sinhala mixed with English) but can understand English. 
Your goal is to recommend K-dramas, explain plots, and help users navigate the KSubZone website. 
Keep responses concise, fun, and use emojis. Do not output markdown code blocks unless necessary.
Always be polite and helpful. If they ask for downloads, remind them they can find Sinhala subtitles on KSubZone.";

        // Format history into a single string for simplicity (since gemini 1.5 flash handles context well)
        $promptContext = "";
        foreach ($history as $msg) {
            $role = $msg['role'] === 'user' ? 'User' : 'Assistant';
            $promptContext .= "{$role}: {$msg['content']}\n";
        }
        $promptContext .= "User: {$message}\nAssistant:";

        try {
            $reply = AiService::generateContent($systemPrompt, $promptContext, 0.7);
            
            header('Content-Type: application/json');
            echo json_encode(['reply' => $reply]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    // 2. AI Smart Search
    public static function smartSearch() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            return;
        }

        $body = json_decode(file_get_contents('php://input'), true);
        $query = $body['query'] ?? '';

        if (empty($query)) {
            http_response_code(400);
            echo json_encode(['error' => 'Search query is required']);
            return;
        }

        $systemPrompt = "You are a search query analyzer for a K-Drama database. 
The user is describing a plot, vibe, or trope of a drama or movie (e.g., 'CEO falls in love with poor girl', 'zombie high school').
Your job is to extract 3-5 highly relevant keywords or genres that can be used in a text search index to find these dramas.
Return ONLY a comma-separated list of keywords, nothing else. Examples: 'CEO, romance, poor girl', 'zombie, high school, survival, thriller'.";

        try {
            // Get keywords from AI
            $keywordsResponse = AiService::generateContent($systemPrompt, "Query: " . $query, 0.3);
            $keywords = array_map('trim', explode(',', $keywordsResponse));
            
            // Search Database using the keywords
            $db = Database::getInstance();
            
            // We'll search both dramas and movies. For simplicity, we use regex on title, synopsis, and genres.
            $searchResults = [];
            
            $regexPattern = implode('|', array_map(function($kw) {
                return preg_quote($kw, '/');
            }, $keywords));
            
            $dbQuery = [
                '$or' => [
                    ['title' => ['$regex' => $regexPattern, '$options' => 'i']],
                    ['synopsis' => ['$regex' => $regexPattern, '$options' => 'i']],
                    ['genres' => ['$regex' => $regexPattern, '$options' => 'i']]
                ]
            ];

            $dramas = $db->find('dramas', $dbQuery, ['limit' => 5]);
            $movies = $db->find('movies', $dbQuery, ['limit' => 5]);
            
            // Format results
            foreach ($dramas as $d) {
                $searchResults[] = [
                    '_id' => (string)$d['_id'],
                    'title' => $d['title'],
                    'type' => 'Drama',
                    'slug' => $d['slug'],
                    'posterUrl' => $d['posterUrl'] ?? null,
                    'year' => $d['releaseYear'] ?? ''
                ];
            }
            foreach ($movies as $m) {
                $searchResults[] = [
                    '_id' => (string)$m['_id'],
                    'title' => $m['title'],
                    'type' => 'Movie',
                    'slug' => $m['slug'],
                    'posterUrl' => $m['posterUrl'] ?? null,
                    'year' => $m['releaseYear'] ?? ''
                ];
            }

            header('Content-Type: application/json');
            echo json_encode([
                'keywords' => $keywords,
                'results' => $searchResults
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    // 3. AI Subtitle Translator (Admin Only)
    public static function translateSubtitle() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            return;
        }

        // Auth check is handled by middleware but we can double check
        
        $body = json_decode(file_get_contents('php://input'), true);
        $srtText = $body['srtContent'] ?? '';

        if (empty($srtText)) {
            http_response_code(400);
            echo json_encode(['error' => 'SRT content is required']);
            return;
        }

        $systemPrompt = "You are a professional subtitle translator. Your task is to translate the provided SRT subtitle file from English to Sinhala.
CRITICAL RULES:
1. DO NOT change the numeric sequence.
2. DO NOT change the timestamps.
3. ONLY translate the dialogue text into natural Sinhala.
4. Keep the exact same formatting (empty lines between subtitle blocks).
5. Output ONLY the valid SRT content, no explanations or markdown wrappers.";

        try {
            // For large SRT files, we'd normally split into chunks. For this demo/feature, we'll try to translate up to 8000 tokens at once.
            $translated = AiService::generateContent($systemPrompt, $srtText, 0.2);
            
            header('Content-Type: application/json');
            echo json_encode([
                'translatedSrt' => $translated
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
