<?php

namespace App\CQRS\EventStore;

use App\CQRS\Events\DomainEvent;

interface EventStoreInterface
{
    public function append(DomainEvent ...$events): void;

    /** @return DomainEvent[] */
    public function getEventsForAggregate(string $aggregateId): array;
}
