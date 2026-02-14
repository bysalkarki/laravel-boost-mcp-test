<?php

namespace App\CQRS\Commands\Content;

use App\CQRS\Bus\CommandInterface;

class DeleteContentCommand implements CommandInterface
{
    public function __construct(
        public string $aggregateId,
    ) {}
}
