<?php

namespace App\CQRS\Projections\Content;

use App\CQRS\Events\Content\ContentGenerationCompleted;
use App\CQRS\Events\Content\ContentGenerationFailed;
use App\CQRS\Events\Content\ContentGenerationRequested;
use App\Models\ReadModels\ContentGeneration;

class ContentGenerationProjector
{
    public function onContentGenerationRequested(ContentGenerationRequested $event): void
    {
        ContentGeneration::create([
            'aggregate_id' => $event->aggregateId,
            'prompt' => $event->prompt,
            'status' => 'pending',
        ]);
    }

    public function onContentGenerationCompleted(ContentGenerationCompleted $event): void
    {
        ContentGeneration::where('aggregate_id', $event->aggregateId)->update([
            'generated_content' => $event->generatedContent,
            'status' => 'completed',
        ]);
    }

    public function onContentGenerationFailed(ContentGenerationFailed $event): void
    {
        ContentGeneration::where('aggregate_id', $event->aggregateId)->update([
            'status' => 'failed',
            'failure_reason' => $event->reason,
        ]);
    }
}
