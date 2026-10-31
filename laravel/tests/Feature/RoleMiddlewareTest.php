<?php

namespace Tests\Feature;

use App\Domain\User\Role;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class RoleMiddlewareTest extends TestCase
{
    use DatabaseTransactions;

    public function test_admin_can_open_an_admin_route(): void
    {
        Route::middleware(['web', 'auth', 'active', 'password.changed', 'role:ADMIN'])
            ->get('/test-admin', fn () => 'admin-only');

        $admin = $this->makeUser(['role' => Role::ADMIN]);

        $this->actingAs($admin)
            ->get('/test-admin')
            ->assertOk()
            ->assertSee('admin-only');
    }

    public function test_inspector_is_forbidden_from_an_admin_route(): void
    {
        Route::middleware(['web', 'auth', 'active', 'password.changed', 'role:ADMIN'])
            ->get('/test-admin', fn () => 'admin-only');

        $inspector = $this->makeUser(['role' => Role::INSPECTOR]);

        $this->actingAs($inspector)
            ->get('/test-admin')
            ->assertForbidden();
    }
}
