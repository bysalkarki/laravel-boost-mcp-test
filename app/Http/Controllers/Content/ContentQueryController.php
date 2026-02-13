<?php

namespace App\Http\Controllers\Content;

use App\CQRS\Bus\QueryBusInterface;
use App\CQRS\Queries\Content\GetContentGenerationQuery;
use App\CQRS\Queries\Content\GetContentGenerationsQuery;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class ContentQueryController extends Controller
{
    public function __construct(
        private readonly QueryBusInterface $queryBus,
    ) {}

    public function create()
    {
        return Inertia::render('Content/Create', [
            'history' => $this->queryBus->dispatch(new GetContentGenerationsQuery),
        ]);
    }

    public function show(string $aggregateId)
    {
        $contentGeneration = $this->queryBus->dispatch(
            new GetContentGenerationQuery($aggregateId),
        );

        return Inertia::render('Content/Create', [
            'aggregateId' => $contentGeneration?->aggregate_id,
            'generatedContent' => $contentGeneration?->generated_content,
            'prompt' => $contentGeneration?->prompt,
            'status' => $contentGeneration?->status,
            'failureReason' => $contentGeneration?->failure_reason,
            'history' => $this->queryBus->dispatch(new GetContentGenerationsQuery),
        ]);
    }
}
