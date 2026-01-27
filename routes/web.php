<?php

use App\Http\Controllers\ContentController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/content/create', [ContentController::class, 'create'])->name('content.create');
Route::post('/content', [ContentController::class, 'store'])->name('content.store');
