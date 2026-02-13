<?php

namespace App\Services;

use Generator;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiService
{
    protected string $ollamaUrl;

    protected string $ollamaModel;

    public function __construct()
    {
        $this->ollamaUrl = config('services.ollama.url');
        $this->ollamaModel = config('services.ollama.model');
    }

    public function generateContent(string $prompt): string
    {
        $fullPrompt = "{$prompt}\n\nIMPORTANT: Keep your response under 120 words. Be concise.";
        try {
            $response = Http::timeout(100)->post($this->ollamaUrl, [
                'model' => $this->ollamaModel,
                'prompt' => $fullPrompt,
                'stream' => true,
                'options' => [
                    'num_predict' => 150, // roughly 100-120 words
                ]
            ]);

            $generatedText = '';

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
            Log::error('Ollama AI generation failed: '.$e->getMessage());
            return 'Failed to generate content from AI. Please check your Ollama server and configuration.';
        }
    }

    /**
     * Stream content generation from Ollama, yielding each token chunk.
     */
    public function generateContentStream(string $prompt): Generator
    {
        $fullPrompt = "{$prompt}\n\nIMPORTANT: Keep your response under 120 words. Be concise.";
        $response = Http::withOptions([
            'stream' => true,
            'timeout' => 120,
        ])->post($this->ollamaUrl, [
            'model' => $this->ollamaModel,
            'prompt' => $fullPrompt,
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
