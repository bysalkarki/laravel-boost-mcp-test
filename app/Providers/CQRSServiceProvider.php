<?php

namespace App\Providers;

use App\CQRS\Bus\CommandBus;
use App\CQRS\Bus\CommandBusInterface;
use App\CQRS\Bus\QueryBus;
use App\CQRS\Bus\QueryBusInterface;
use App\CQRS\Commands\Content\GenerateContentCommand;
use App\CQRS\Events\Content\ContentGenerationCompleted;
use App\CQRS\Events\Content\ContentGenerationFailed;
use App\CQRS\Events\Content\ContentGenerationRequested;
use App\CQRS\EventStore\EventStore;
use App\CQRS\EventStore\EventStoreInterface;
use App\CQRS\Handlers\Content\GenerateContentHandler;
use App\CQRS\Handlers\Content\GetContentGenerationHandler;
use App\CQRS\Handlers\Content\GetContentGenerationsHandler;
use App\CQRS\Projections\Content\ContentGenerationProjector;
use App\CQRS\Queries\Content\GetContentGenerationQuery;
use App\CQRS\Queries\Content\GetContentGenerationsQuery;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class CQRSServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(EventStoreInterface::class, EventStore::class);

        $this->app->singleton(CommandBusInterface::class, function ($app) {
            $bus = new CommandBus($app);
            $bus->register(GenerateContentCommand::class, GenerateContentHandler::class);

            return $bus;
        });

        $this->app->singleton(QueryBusInterface::class, function ($app) {
            $bus = new QueryBus($app);
            $bus->register(GetContentGenerationQuery::class, GetContentGenerationHandler::class);
            $bus->register(GetContentGenerationsQuery::class, GetContentGenerationsHandler::class);

            return $bus;
        });
    }

    public function boot(): void
    {
        $projector = $this->app->make(ContentGenerationProjector::class);

        Event::listen(ContentGenerationRequested::class, [$projector, 'onContentGenerationRequested']);
        Event::listen(ContentGenerationCompleted::class, [$projector, 'onContentGenerationCompleted']);
        Event::listen(ContentGenerationFailed::class, [$projector, 'onContentGenerationFailed']);
    }
}
