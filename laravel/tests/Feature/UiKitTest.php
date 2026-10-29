<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\User\Role;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class UiKitTest extends TestCase
{
    use DatabaseTransactions;

    public function test_admin_can_open_the_ui_kit(): void
    {
        $admin = $this->makeUser(['role' => Role::ADMIN]);

        $this->actingAs($admin)
            ->get(route('ui-kit.index'))
            ->assertOk()
            ->assertSee('UI kit')
            ->assertSee('Reusable components');
    }

    public function test_non_admin_cannot_open_the_ui_kit(): void
    {
        $inspector = $this->makeUser();

        $this->actingAs($inspector)
            ->get(route('ui-kit.index'))
            ->assertForbidden();
    }
}
