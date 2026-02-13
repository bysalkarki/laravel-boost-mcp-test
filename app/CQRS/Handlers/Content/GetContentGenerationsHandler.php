<?php

namespace App\CQRS\Handlers\Content;

use App\CQRS\Queries\Content\GetContentGenerationsQuery;
use App\Models\ReadModels\ContentGeneration;
use Illuminate\Database\Eloquent\Collection;

class GetContentGenerationsHandler
{
    public function handle(GetContentGenerationsQuery $query): Collection
    {
        return ContentGeneration::orderByDesc('created_at')->get();
    }
}
