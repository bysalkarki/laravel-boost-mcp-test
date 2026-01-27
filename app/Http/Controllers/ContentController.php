<?php

namespace App\Http\Controllers;

use App\Services\AiService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContentController extends Controller
{
    public function create()
    {
        return Inertia::render('Content/Create');
    }

    public function store(Request $request, AiService $aiService)
    {
        $data = $request->validate([
            'prompt' => ['required', 'string', 'min:10'],
        ]);

        $generatedContent = $aiService->generateContent($data['prompt']);

        return Inertia::render('Content/Create', [
            'generatedContent' => $generatedContent,
            'prompt' => $data['prompt'], // Pass the prompt back to persist in the form
        ]);
    }
}
