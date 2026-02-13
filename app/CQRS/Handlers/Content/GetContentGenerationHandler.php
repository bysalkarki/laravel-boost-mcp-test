<?php

namespace App\CQRS\Handlers\Content;

use App\CQRS\Queries\Content\GetContentGenerationQuery;
use App\Models\ReadModels\ContentGeneration;

class GetContentGenerationHandler
{
    public function handle(GetContentGenerationQuery $query): ?ContentGeneration
    {
        if ($query->aggregateId === null) {
            return null;
        }

        return ContentGeneration::where('aggregate_id', $query->aggregateId)->first();
    }
}
