<?php

namespace App\CQRS\Bus;

interface CommandBusInterface
{
    public function dispatch(CommandInterface $command): mixed;
}
