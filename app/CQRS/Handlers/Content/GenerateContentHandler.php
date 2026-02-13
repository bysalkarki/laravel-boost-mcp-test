<?php

namespace App\CQRS\Handlers\Content;

use App\CQRS\Commands\Content\GenerateContentCommand;
use App\CQRS\Events\Content\ContentGenerationCompleted;
use App\CQRS\Events\Content\ContentGenerationFailed;
use App\CQRS\Events\Content\ContentGenerationRequested;
use App\CQRS\EventStore\EventStoreInterface;
use App\Services\AiService;
use Illuminate\Support\Str;

class GenerateContentHandler
{
    public function __construct(
        private EventStoreInterface $eventStore,
        private AiService $aiService,
    ) {
    }

    public function handle(GenerateContentCommand $command): string
    {
        $aggregateId = (string) Str::uuid();

        $this->eventStore->append(
            new ContentGenerationRequested($aggregateId, $command->prompt),
        );

        try {
            $generatedContent = $this->aiService->generateContent($command->prompt);

            $this->eventStore->append(
                new ContentGenerationCompleted($aggregateId, $command->prompt, $generatedContent),
            );
        } catch (\Throwable $e) {
            $this->eventStore->append(
                new ContentGenerationFailed($aggregateId, $command->prompt, $e->getMessage()),
            );
        }

        return $aggregateId;
    }
}
