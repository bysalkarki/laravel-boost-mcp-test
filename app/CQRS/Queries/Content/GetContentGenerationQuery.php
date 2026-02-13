<?php

namespace App\CQRS\Queries\Content;

use App\CQRS\Bus\QueryInterface;

class GetContentGenerationQuery implements QueryInterface
{
    public function __construct(
        public readonly ?string $aggregateId = null,
    ) {
    }
}
