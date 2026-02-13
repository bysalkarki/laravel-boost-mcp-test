<?php

use App\Http\Controllers\Content\ContentCommandController;
use App\Http\Controllers\Content\ContentQueryController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/content/create', [ContentQueryController::class, 'create'])->name('content.create');
Route::post('/content', [ContentCommandController::class, 'store'])->name('content.store');
Route::get('/content/{aggregateId}', [ContentQueryController::class, 'show'])->name('content.show');
