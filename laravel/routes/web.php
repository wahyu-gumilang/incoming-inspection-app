<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Proof of concept for the Laravel 13 + Livewire 4 migration.
Route::get('/items', function () {
    return view('items.index');
})->name('items.index');
