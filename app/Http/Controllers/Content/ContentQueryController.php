<?php

namespace App\Http\Controllers\Content;

use App\CQRS\Bus\QueryBusInterface;
use App\CQRS\Queries\Content\GetContentGenerationQuery;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class ContentQueryController extends Controller
{
    public function create()
    {
        return Inertia::render('Content/Create');
    }

    public function show(string $aggregateId, QueryBusInterface $queryBus)
    {
        $contentGeneration = $queryBus->dispatch(
            new GetContentGenerationQuery($aggregateId),
        );

        return Inertia::render('Content/Create', [
            'aggregateId' => $contentGeneration?->aggregate_id,
            'generatedContent' => $contentGeneration?->generated_content,
            'prompt' => $contentGeneration?->prompt,
            'status' => $contentGeneration?->status,
            'failureReason' => $contentGeneration?->failure_reason,
        ]);
    }
}
