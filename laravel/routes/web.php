<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\AvatarController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ItemsController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UiKitController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\VendorManagementController;
use Illuminate\Support\Facades\Route;

Route::get('/login', [LoginController::class, 'show'])->name('login');
Route::post('/login', [LoginController::class, 'login'])->name('login.store');
Route::post('/logout', [LoginController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

Route::middleware(['auth', 'active'])->group(function (): void {
    Route::get('/change-password', [PasswordController::class, 'show'])->name('password.change');
    Route::post('/change-password', [PasswordController::class, 'update'])->name('password.update');

    Route::middleware('password.changed')->group(function (): void {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('/items', [ItemsController::class, 'index'])->name('items.index');
        Route::get('/items/{itemid}', [ItemsController::class, 'show'])->name('items.show');
        Route::get('/inspections', [ModuleController::class, 'inspections'])->name('inspections.index');
        Route::get('/aql', [ModuleController::class, 'aql'])->name('aql.index');
        Route::get('/vendors', [VendorManagementController::class, 'index'])->name('vendors.index');
        Route::get('/reports', [ModuleController::class, 'reports'])->name('reports.index');
        Route::get('/users', [UserManagementController::class, 'index'])
            ->middleware('role:ADMIN')
            ->name('users.index');
        Route::get('/ui-kit', [UiKitController::class, 'index'])
            ->middleware('role:ADMIN')
            ->name('ui-kit.index');
        Route::get('/help', [ModuleController::class, 'help'])->name('help.index');
        Route::get('/avatars/{filename}', [AvatarController::class, 'show'])->name('avatars.show');
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::patch('/profile/theme', [ProfileController::class, 'updateTheme'])->name('profile.theme');
    });
});
