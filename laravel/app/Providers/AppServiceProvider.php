<?php

namespace App\Providers;

use App\Hashing\LegacyBcryptHasher;
use Illuminate\Hashing\HashManager;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->resolving('hash', function (HashManager $hash): void {
            $hash->extend(
                'legacy_bcrypt',
                fn () => new LegacyBcryptHasher(config('hashing.bcrypt', [])),
            );
        });
    }

    public function boot(): void
    {
        //
    }
}
