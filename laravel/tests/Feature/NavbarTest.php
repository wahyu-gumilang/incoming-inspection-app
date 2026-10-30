<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\User\Role;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class NavbarTest extends TestCase
{
    use DatabaseTransactions;

    public function test_dashboard_renders_the_primary_navigation_for_an_inspector(): void
    {
        $user = $this->makeUser(['fullname' => 'Budi Santoso']);

        $this->actingAs($user)
            ->get('/')
            ->assertOk()
            ->assertSee('Dashboard')
            ->assertSee('Items')
            ->assertSee('Inspection Form')
            ->assertSee('AQL Table')
            ->assertSee('Vendor')
            ->assertSee('Reports')
            ->assertDontSee('User Management')
            ->assertSee('Search items, part numbers...')
            ->assertSee('data-weather-badge', false)
            ->assertSee('Account Option')
            ->assertSee('User Setting')
            ->assertSee('Help Center')
            ->assertSee('Light')
            ->assertSee('Dark')
            ->assertSee('System')
            ->assertSee('Sign out');
    }

    public function test_admin_also_sees_user_management(): void
    {
        $admin = $this->makeUser(['role' => Role::ADMIN]);

        $this->actingAs($admin)
            ->get('/')
            ->assertOk()
            ->assertSee('User Management');
    }

    public function test_module_placeholders_are_available_to_signed_in_users(): void
    {
        $user = $this->makeUser();

        foreach (['/inspections', '/aql', '/reports'] as $path) {
            $this->actingAs($user)
                ->get($path)
                ->assertOk()
                ->assertSee('Coming next');
        }
    }

    public function test_help_center_is_available(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user)
            ->get('/help')
            ->assertOk()
            ->assertSee('Help Center')
            ->assertSee('Sign in and access');
    }

    public function test_inspector_cannot_open_user_management(): void
    {
        $inspector = $this->makeUser(['role' => Role::INSPECTOR]);

        $this->actingAs($inspector)
            ->get('/users')
            ->assertForbidden();
    }

    public function test_admin_can_open_user_management(): void
    {
        $admin = $this->makeUser(['role' => Role::ADMIN]);

        $this->actingAs($admin)
            ->get('/users')
            ->assertOk()
            ->assertSee('User Management')
            ->assertSee('Add user');
    }
}
