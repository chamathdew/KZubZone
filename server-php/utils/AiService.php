<?php
namespace Utils;

class AiService {
    private static function getApiKey() {
        $apiKey = $_ENV['GEMINI_API_KEY'] ?? null;
        if (!$apiKey || $apiKey === 'your_gemini_api_key_here') {
            try {
                $db = \Config\Database::getInstance();
                $setting = $db->findOne('settings', ['key' => ['$in' => ['GEMINI_API_KEY', 'gemini_api_key', 'gemini']]]);
                if ($setting && !empty($setting['value'])) {
                    $apiKey = trim($setting['value']);
                }
            } catch (\Exception $e) {
                // Fallback gracefully if database lookup fails
            }
        }
        return $apiKey;
    }

    public static function generateContent($systemInstruction, $userPrompt, $temperature = 0.7) {
        $apiKey = self::getApiKey();
        
        if (!$apiKey || $apiKey === 'your_gemini_api_key_here') {
            throw new \Exception("Gemini API Key is not configured. Please add GEMINI_API_KEY to your .env file or settings under RAW CONFIG KEYS.");
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $apiKey;

        $payload = [
            "contents" => [
                [
                    "role" => "user",
                    "parts" => [
                        ["text" => $userPrompt]
                    ]
                ]
            ],
            "systemInstruction" => [
                "parts" => [
                    ["text" => $systemInstruction]
                ]
            ],
            "generationConfig" => [
                "temperature" => $temperature,
                "topK" => 40,
                "topP" => 0.95,
                "maxOutputTokens" => 8192
            ]
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        // Ignore SSL verification for local dev if needed
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \Exception("cURL Error: " . $error);
        }

        $data = json_decode($response, true);

        if ($httpCode !== 200) {
            $errorMessage = $data['error']['message'] ?? 'Unknown API error';
            throw new \Exception("Gemini API Error ({$httpCode}): " . $errorMessage);
        }

        if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            return $data['candidates'][0]['content']['parts'][0]['text'];
        }

        throw new \Exception("Unexpected response format from Gemini API");
    }
}
