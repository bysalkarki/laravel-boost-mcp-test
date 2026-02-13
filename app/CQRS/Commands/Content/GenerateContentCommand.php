<?php

namespace App\CQRS\Commands\Content;

use App\CQRS\Bus\CommandInterface;

class GenerateContentCommand implements CommandInterface
{
    public function __construct(
        public readonly string $prompt,
    ) {
    }
}
