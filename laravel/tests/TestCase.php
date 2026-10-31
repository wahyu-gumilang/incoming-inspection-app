<?php

namespace Tests;

use App\Domain\User\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

abstract class TestCase extends BaseTestCase
{
    /**
     * Create a test user inside the current database transaction.
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function makeUser(array $overrides = []): User
    {
        return User::create(array_merge([
            'username' => 'test-'.Str::lower(Str::random(8)),
            'fullname' => 'Test User',
            'email' => null,
            'role' => Role::INSPECTOR,
            'password_hash' => Hash::make('Test-pass-123'),
            'active' => true,
            'must_change_password' => false,
            'theme' => 'light',
            'last_login_at' => null,
        ], $overrides));
    }
}
