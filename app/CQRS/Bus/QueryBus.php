<?php

namespace App\CQRS\Bus;

use Illuminate\Contracts\Container\Container;

class QueryBus implements QueryBusInterface
{
    /** @var array<class-string<QueryInterface>, class-string> */
    private array $handlers = [];

    public function __construct(private Container $container)
    {
    }

    public function register(string $queryClass, string $handlerClass): void
    {
        $this->handlers[$queryClass] = $handlerClass;
    }

    public function dispatch(QueryInterface $query): mixed
    {
        $queryClass = get_class($query);

        if (! isset($this->handlers[$queryClass])) {
            throw new \RuntimeException("No handler registered for query: {$queryClass}");
        }

        $handler = $this->container->make($this->handlers[$queryClass]);

        return $handler->handle($query);
    }
}
