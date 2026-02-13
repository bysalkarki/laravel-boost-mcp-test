<?php

namespace App\CQRS\Bus;

use Illuminate\Contracts\Container\Container;

class CommandBus implements CommandBusInterface
{
    /** @var array<class-string<CommandInterface>, class-string> */
    private array $handlers = [];

    public function __construct(private Container $container)
    {
    }

    public function register(string $commandClass, string $handlerClass): void
    {
        $this->handlers[$commandClass] = $handlerClass;
    }

    public function dispatch(CommandInterface $command): mixed
    {
        $commandClass = get_class($command);

        if (! isset($this->handlers[$commandClass])) {
            throw new \RuntimeException("No handler registered for command: {$commandClass}");
        }

        $handler = $this->container->make($this->handlers[$commandClass]);

        return $handler->handle($command);
    }
}
