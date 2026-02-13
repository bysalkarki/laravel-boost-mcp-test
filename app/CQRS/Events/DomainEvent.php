<?php

namespace App\CQRS\Events;

use Illuminate\Support\Str;

abstract class DomainEvent
{
    public readonly string $eventId;
    public readonly string $aggregateId;
    public readonly \DateTimeImmutable $occurredAt;

    public function __construct(string $aggregateId, ?string $eventId = null, ?\DateTimeImmutable $occurredAt = null)
    {
        $this->aggregateId = $aggregateId;
        $this->eventId = $eventId ?? (string) Str::uuid();
        $this->occurredAt = $occurredAt ?? new \DateTimeImmutable();
    }

    abstract public function aggregateType(): string;

    abstract public function toPayload(): array;

    abstract public static function fromPayload(string $aggregateId, array $payload, string $eventId, \DateTimeImmutable $occurredAt): static;

    public function eventType(): string
    {
        return static::class;
    }
}
