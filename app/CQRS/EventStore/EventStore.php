<?php

namespace App\CQRS\EventStore;

use App\CQRS\Events\DomainEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

class EventStore implements EventStoreInterface
{
    public function append(DomainEvent ...$events): void
    {
        DB::transaction(function () use ($events) {
            foreach ($events as $event) {
                $lastVersion = DB::table('domain_events')
                    ->where('aggregate_id', $event->aggregateId)
                    ->max('version') ?? 0;

                DB::table('domain_events')->insert([
                    'event_id' => $event->eventId,
                    'aggregate_id' => $event->aggregateId,
                    'aggregate_type' => $event->aggregateType(),
                    'event_type' => $event->eventType(),
                    'version' => $lastVersion + 1,
                    'payload' => json_encode($event->toPayload()),
                    'metadata' => json_encode([]),
                    'occurred_at' => $event->occurredAt->format('Y-m-d H:i:s'),
                ]);

                Event::dispatch($event);
            }
        });
    }

    public function getEventsForAggregate(string $aggregateId): array
    {
        $rows = DB::table('domain_events')
            ->where('aggregate_id', $aggregateId)
            ->orderBy('version')
            ->get();

        return $rows->map(function ($row) {
            $eventClass = $row->event_type;

            if (! class_exists($eventClass)) {
                throw new \RuntimeException("Event class not found: {$eventClass}");
            }

            return $eventClass::fromPayload(
                $row->aggregate_id,
                json_decode($row->payload, true),
                $row->event_id,
                new \DateTimeImmutable($row->occurred_at),
            );
        })->all();
    }
}
