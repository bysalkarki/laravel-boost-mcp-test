<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Generator;

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

    /**
     * Stream content generation from Ollama, yielding each token chunk.
     */
    public function generateContentStream(string $prompt): Generator
    {
        $response = Http::withOptions([
            'stream' => true,
            'timeout' => 120,
        ])->post($this->ollamaUrl, [
            'model' => $this->ollamaModel,
            'prompt' => $prompt,
            'stream' => true,
        ]);

        $body = $response->toPsrResponse()->getBody();
        $buffer = '';

        while (! $body->eof()) {
            $buffer .= $body->read(1024);
            // Process complete lines from buffer
            while (($newlinePos = strpos($buffer, "\n")) !== false) {
                $line = substr($buffer, 0, $newlinePos);
                $buffer = substr($buffer, $newlinePos + 1);

                if ($line === '') {
                    continue;
                }

                $data = json_decode($line, true);
                if (isset($data['response']) && $data['response'] !== '') {
                    yield $data['response'];
                }

                if (isset($data['done']) && $data['done'] === true) {
                    return;
                }
            }
        }
    }
}
