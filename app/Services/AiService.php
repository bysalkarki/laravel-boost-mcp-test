<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiService
{
    protected string $ollamaUrl;
    protected string $ollamaModel;

    public function __construct()
    {
        // For now, hardcode the URL and model.
        // In a real application, these would come from configuration (e.g., .env file).
        $this->ollamaUrl = 'http://localhost:11434/api/generate';
        $this->ollamaModel = 'gemma3:4b';
    }

    public function generateContent(string $prompt): string
    {
        try {
            $response = Http::post($this->ollamaUrl, [
                'model' => $this->ollamaModel,
                'prompt' => $prompt,
                'stream' => true,
                'timeout' => 100,
            ]);
            $generatedText = '';
            // Ollama streams responses, so we need to process each chunk.
            foreach (explode("\n", $response->body()) as $chunk) {
                if ($chunk === '') {
                    continue;
                }
                $data = json_decode($chunk, true);
                if (isset($data['response'])) {
                    $generatedText .= $data['response'];
                }
            }
Log::info($generatedText);
            return $generatedText;

        } catch (\Throwable $e) {
            Log::error('Ollama AI generation failed: ' . $e->getMessage());
            return 'Failed to generate content from AI. Please check your Ollama server and configuration.';
        }
    }
}
