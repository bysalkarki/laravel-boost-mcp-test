<?php

namespace App\CQRS\Events\Content;

use App\CQRS\Events\DomainEvent;

class ContentGenerationCompleted extends DomainEvent
{
    public function __construct(
        string $aggregateId,
        public readonly string $prompt,
        public readonly string $generatedContent,
        ?string $eventId = null,
        ?\DateTimeImmutable $occurredAt = null,
    ) {
        parent::__construct($aggregateId, $eventId, $occurredAt);
    }

    public function aggregateType(): string
    {
        return 'ContentGeneration';
    }

    public function toPayload(): array
    {
        return [
            'prompt' => $this->prompt,
            'generated_content' => $this->generatedContent,
        ];
    }

    public static function fromPayload(string $aggregateId, array $payload, string $eventId, \DateTimeImmutable $occurredAt): static
    {
        return new static($aggregateId, $payload['prompt'], $payload['generated_content'], $eventId, $occurredAt);
    }
}
