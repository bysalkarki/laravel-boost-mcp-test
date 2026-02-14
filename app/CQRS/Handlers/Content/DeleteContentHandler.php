<?php

namespace App\CQRS\Handlers\Content;

use App\CQRS\Commands\Content\DeleteContentCommand;
use App\CQRS\Events\Content\ContentGenerationDeleted;
use App\CQRS\EventStore\EventStoreInterface;

class DeleteContentHandler
{
    public function __construct(
        private EventStoreInterface $eventStore,
    ) {}

    public function handle(DeleteContentCommand $command): void
    {
        $this->eventStore->append(
            new ContentGenerationDeleted($command->aggregateId),
        );
    }
}
