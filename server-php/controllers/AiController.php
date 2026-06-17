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

        // Check if enabled
        $db = Database::getInstance();
        $setting = $db->findOne('settings', ['key' => 'siteContent']);
        $siteContent = $setting['value'] ?? \Utils\SiteContentDefaults::get();
        if (isset($siteContent['ai']['enableChatbot']) && !$siteContent['ai']['enableChatbot']) {
            http_response_code(403);
            echo json_encode(['error' => 'AI Chatbot is disabled by the administrator.']);
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

        // Check if enabled
        $db = Database::getInstance();
        $setting = $db->findOne('settings', ['key' => 'siteContent']);
        $siteContent = $setting['value'] ?? \Utils\SiteContentDefaults::get();
        if (isset($siteContent['ai']['enableSmartSearch']) && !$siteContent['ai']['enableSmartSearch']) {
            http_response_code(403);
            echo json_encode(['error' => 'AI Smart Search is disabled by the administrator.']);
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
                'status' => 'Published',
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

    // Free Google Translate Helper Method using HTTP GET translate_a/single
    private static function googleTranslateFree($text, $sl = 'en', $tl = 'si') {
        $url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" . $sl . "&tl=" . $tl . "&dt=t&q=" . urlencode($text);
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new \Exception("Google Translate cURL Error: " . $error);
        }
        
        $json = json_decode($response, true);
        if (!is_array($json) || !isset($json[0])) {
            throw new \Exception("Unexpected response from Google Translate API");
        }
        
        $translatedText = '';
        foreach ($json[0] as $sentences) {
            $translatedText .= $sentences[0] ?? '';
        }
        return $translatedText;
    }

    // Translate SRT with grouping chunk logic to stay within Google Translate length boundaries
    private static function translateSrtFree($srtText) {
        // Standardize newlines
        $srtText = str_replace("\r\n", "\n", $srtText);
        $blocks = explode("\n\n", $srtText);
        
        $translatedSrt = "";
        $currentGroup = [];
        $currentLength = 0;
        
        foreach ($blocks as $block) {
            $block = trim($block);
            if (empty($block)) continue;
            
            $blockLength = strlen($block);
            // If adding this block exceeds 3500 characters, translate current group first
            if ($currentLength + $blockLength + 2 > 3500 && !empty($currentGroup)) {
                $groupText = implode("\n\n", $currentGroup);
                $translatedGroup = self::googleTranslateFree($groupText);
                $translatedSrt .= $translatedGroup . "\n\n";
                
                $currentGroup = [];
                $currentLength = 0;
            }
            
            $currentGroup[] = $block;
            $currentLength += $blockLength + 2;
        }
        
        if (!empty($currentGroup)) {
            $groupText = implode("\n\n", $currentGroup);
            $translatedGroup = self::googleTranslateFree($groupText);
            $translatedSrt .= $translatedGroup;
        }
        
        return trim($translatedSrt);
    }

    // 3. AI Subtitle Translator (Admin Only)
    public static function translateSubtitle() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            return;
        }

        // Check if enabled
        $db = Database::getInstance();
        $setting = $db->findOne('settings', ['key' => 'siteContent']);
        $siteContent = $setting['value'] ?? \Utils\SiteContentDefaults::get();
        if (isset($siteContent['ai']['enableTranslation']) && !$siteContent['ai']['enableTranslation']) {
            http_response_code(403);
            echo json_encode(['error' => 'AI Subtitle Translation is disabled by the administrator.']);
            return;
        }

        // Auth check is handled by middleware but we can double check
        
        $body = json_decode(file_get_contents('php://input'), true);
        $srtText = $body['srtContent'] ?? '';
        $engine = $body['engine'] ?? 'gemini';

        if (empty($srtText)) {
            http_response_code(400);
            echo json_encode(['error' => 'SRT content is required']);
            return;
        }

        if ($engine === 'google') {
            try {
                $translated = self::translateSrtFree($srtText);
                header('Content-Type: application/json');
                echo json_encode([
                    'translatedSrt' => $translated
                ]);
                return;
            } catch (\Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => $e->getMessage()]);
                return;
            }
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

    // 4. AI Subtitle Polisher (Admin Only - Spoken to Formal Sinhala)
    public static function polishSubtitle() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            return;
        }

        // Check if enabled
        $db = Database::getInstance();
        $setting = $db->findOne('settings', ['key' => 'siteContent']);
        $siteContent = $setting['value'] ?? \Utils\SiteContentDefaults::get();
        if (isset($siteContent['ai']['enableTranslation']) && !$siteContent['ai']['enableTranslation']) {
            http_response_code(403);
            echo json_encode(['error' => 'AI Subtitle Polishing is disabled by the administrator.']);
            return;
        }

        $body = json_decode(file_get_contents('php://input'), true);
        $srtText = $body['srtContent'] ?? '';

        if (empty($srtText)) {
            http_response_code(400);
            echo json_encode(['error' => 'SRT content is required']);
            return;
        }

        $systemPrompt = "You are a professional Sinhala language editor and subtitle polisher. 
Your task is to convert the provided Sinhala SRT subtitle file from informal/spoken Sinhala into perfect, natural, grammatically correct written/formal Sinhala (ලෝකෝත්තර ලිඛිත සිංහල / සම්මත සිංහල).
CRITICAL RULES:
1. DO NOT change the numeric sequence.
2. DO NOT change the timestamps.
3. ONLY convert the spoken Sinhala phrasing/words into standard, formal written Sinhala (e.g. convert common spoken words like 'කරනවා' to 'කරයි' or 'කරනවා' / 'කරන්නෙ' to standard written/formal forms but keep dialogue readability. Do not make it excessively archaic, but grammatically perfect formal/written Sinhala).
4. Keep the exact same formatting (empty lines between subtitle blocks).
5. Output ONLY the valid SRT content, no explanations or markdown wrappers.";

        try {
            $polished = AiService::generateContent($systemPrompt, $srtText, 0.2);
            
            header('Content-Type: application/json');
            echo json_encode([
                'polishedSrt' => $polished
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
