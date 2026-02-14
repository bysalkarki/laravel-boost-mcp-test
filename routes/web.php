<?php

use App\Http\Controllers\Content\ContentCommandController;
use App\Http\Controllers\Content\ContentQueryController;
use App\Http\Controllers\Content\ContentStreamController;
use Illuminate\Support\Facades\Route;

Route::get('/', [ContentQueryController::class, 'create'])->name('home');
Route::post('/content', [ContentCommandController::class, 'store'])->name('content.store');
Route::post('/content/stream', [ContentStreamController::class, 'stream'])->name('content.stream');
Route::get('/content/{aggregateId}', [ContentQueryController::class, 'show'])->name('content.show');
Route::delete('/content/{aggregateId}', [ContentCommandController::class, 'destroy'])->name('content.destroy');
