<?php

namespace App\Http\Controllers\Content;

use App\CQRS\Bus\CommandBusInterface;
use App\CQRS\Commands\Content\DeleteContentCommand;
use App\CQRS\Commands\Content\GenerateContentCommand;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ContentCommandController extends Controller
{
    public function store(Request $request, CommandBusInterface $commandBus)
    {
        $data = $request->validate([
            'prompt' => ['required', 'string', 'min:10'],
        ]);

        $aggregateId = $commandBus->dispatch(
            new GenerateContentCommand($data['prompt']),
        );

        return redirect()->route('content.show', $aggregateId);
    }

    public function destroy(string $aggregateId, CommandBusInterface $commandBus)
    {
        $commandBus->dispatch(
            new DeleteContentCommand($aggregateId),
        );

        return redirect()->route('home');
    }
}
