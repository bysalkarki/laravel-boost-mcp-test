<?php

namespace App\CQRS\Events\Content;

use App\CQRS\Events\DomainEvent;

class ContentGenerationRequested extends DomainEvent
{
    public function __construct(
        string $aggregateId,
        public readonly string $prompt,
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
        return ['prompt' => $this->prompt];
    }

    public static function fromPayload(string $aggregateId, array $payload, string $eventId, \DateTimeImmutable $occurredAt): static
    {
        return new static($aggregateId, $payload['prompt'], $eventId, $occurredAt);
    }
}
