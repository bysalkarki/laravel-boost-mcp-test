<?php

namespace App\CQRS\Bus;

interface QueryBusInterface
{
    public function dispatch(QueryInterface $query): mixed;
}
