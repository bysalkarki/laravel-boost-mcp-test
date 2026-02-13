<?php

namespace App\Http\Controllers\Content;

use App\CQRS\Events\Content\ContentGenerationCompleted;
use App\CQRS\Events\Content\ContentGenerationFailed;
use App\CQRS\Events\Content\ContentGenerationRequested;
use App\CQRS\EventStore\EventStoreInterface;
use App\Http\Controllers\Controller;
use App\Services\AiService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContentStreamController extends Controller
{
    public function stream(Request $request, AiService $aiService, EventStoreInterface $eventStore): StreamedResponse
    {
        $data = $request->validate([
            'prompt' => ['required', 'string', 'min:10'],
        ]);

        $aggregateId = (string) Str::uuid();
        $prompt = $data['prompt'];

        $eventStore->append(
            new ContentGenerationRequested($aggregateId, $prompt),
        );

        return new StreamedResponse(function () use ($aiService, $eventStore, $aggregateId, $prompt) {
            // Send aggregate ID first
            echo 'data: '.json_encode(['type' => 'start', 'aggregateId' => $aggregateId])."\n\n";
            flush();

            $fullContent = '';

            try {
                foreach ($aiService->generateContentStream($prompt) as $chunk) {
                    $fullContent .= $chunk;
                    echo 'data: '.json_encode(['type' => 'chunk', 'content' => $chunk])."\n\n";
                    flush();
                }

                $eventStore->append(
                    new ContentGenerationCompleted($aggregateId, $prompt, $fullContent),
                );

                flush();
            } catch (\Throwable $e) {
                $eventStore->append(
                    new ContentGenerationFailed($aggregateId, $prompt, $e->getMessage()),
                );

                flush();
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}
