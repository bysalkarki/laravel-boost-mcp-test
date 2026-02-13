<?php

namespace App\CQRS\Commands\Content;

use App\CQRS\Bus\CommandInterface;

class GenerateContentCommand implements CommandInterface
{
    public function __construct(
        public  string $prompt,
    ) {
        $this->prompt  = "{$prompt}\n\nIMPORTANT: Keep your response under 150 words. Be concise. Do not Repeat the Question";
    }
}
