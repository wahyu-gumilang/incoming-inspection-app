<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\User\Role;
use App\Livewire\Users\UserManager;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Livewire\Livewire;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use DatabaseTransactions;

    public function test_admin_sees_the_user_list(): void
    {
        $admin = $this->makeUser(['role' => Role::ADMIN, 'fullname' => 'Gumilang']);
        $target = $this->makeUser(['fullname' => 'Budi Santoso']);

        Livewire::actingAs($admin)
            ->test(UserManager::class)
            ->assertSee('User Management')
            ->assertSee('Gumilang')
            ->assertSee($target->fullname);
    }

    public function test_search_and_role_filter_narrow_the_list(): void
    {
        $admin = $this->makeUser(['role' => Role::ADMIN, 'fullname' => 'Gumilang']);
        $checker = $this->makeUser(['fullname' => 'Siti Rahayu', 'role' => Role::CHECKER]);
        $inspector = $this->makeUser(['fullname' => 'Budi Santoso', 'role' => Role::INSPECTOR]);

        Livewire::actingAs($admin)
            ->test(UserManager::class)
            ->set('search', 'Budi')
            ->assertSee('Budi Santoso')
            ->assertDontSee('Siti Rahayu')
            ->set('search', '')
            ->set('role', Role::CHECKER)
            ->assertSee('Siti Rahayu')
            ->assertDontSee($inspector->fullname);
    }

    public function test_role_and_status_dropdowns_select_values(): void
    {
        $admin = $this->makeUser(['role' => Role::ADMIN]);

        Livewire::actingAs($admin)
            ->test(UserManager::class)
            ->call('toggleRole')
            ->assertSet('openRole', true)
            ->assertSee('All roles')
            ->call('selectRole', Role::CHECKER)
            ->assertSet('role', Role::CHECKER)
            ->assertSet('openRole', false)
            ->call('toggleStatus')
            ->assertSet('openStatus', true)
            ->call('selectStatus', 'inactive')
            ->assertSet('status', 'inactive')
            ->assertSet('openStatus', false);
    }

    public function test_form_role_dropdown_selects_a_role(): void
    {
        $admin = $this->makeUser(['role' => Role::ADMIN]);

        Livewire::actingAs($admin)
            ->test(UserManager::class)
            ->call('openCreate')
            ->call('toggleFormRole')
            ->assertSet('openFormRole', true)
            ->assertSee('Inspector')
            ->call('selectFormRole', Role::ADMIN)
            ->assertSet('formRole', Role::ADMIN)
            ->assertSet('openFormRole', false);
    }

    public function test_admin_creates_a_user_with_a_temporary_password(): void
    {
        $admin = $this->makeUser(['role' => Role::ADMIN]);

        Livewire::actingAs($admin)
            ->test(UserManager::class)
            ->call('openCreate')
            ->set('username', '10412')
            ->set('fullname', 'Rina Kartika')
            ->set('email', 'rina@example.com')
            ->set('formRole', Role::INSPECTOR)
            ->call('createUser')
            ->assertHasNoErrors()
            ->assertSet('showCreate', false);

        $user = User::where('username', '10412')->firstOrFail();
        $password = session('temporary_password');

        $this->assertSame('Rina Kartika', $user->fullname);
        $this->assertSame('rina@example.com', $user->email);
        $this->assertSame(Role::INSPECTOR, $user->role);
        $this->assertTrue($user->active);
        $this->assertTrue($user->must_change_password);
        $this->assertIsString($password);
        $this->assertMatchesRegularExpression('/^[A-Za-z0-9]{5}-[A-Za-z0-9]{5}$/', $password);
        $this->assertTrue(Hash::check($password, $user->password_hash));
    }

    public function test_create_validates_username_and_role(): void
    {
        $admin = $this->makeUser(['role' => Role::ADMIN]);

        Livewire::actingAs($admin)
            ->test(UserManager::class)
            ->call('openCreate')
            ->set('username', 'a b')
            ->set('fullname', '')
            ->set('formRole', 'BOSS')
            ->call('createUser')
            ->assertHasErrors(['username', 'fullname', 'formRole']);
    }

    public function test_username_must_be_unique(): void
    {
        $admin = $this->makeUser(['role' => Role::ADMIN]);
        $existing = $this->makeUser();

        Livewire::actingAs($admin)
            ->test(UserManager::class)
            ->call('openCreate')
            ->set('username', $existing->username)
            ->set('fullname', 'Another User')
            ->set('formRole', Role::INSPECTOR)
            ->call('createUser')
            ->assertHasErrors('username');
    }

    public function test_admin_updates_another_user(): void
    {
        $admin = $this->makeUser(['role' => Role::ADMIN]);
        $target = $this->makeUser(['fullname' => 'Budi Santoso']);

        Livewire::actingAs($admin)
            ->test(UserManager::class)
            ->call('openEdit', $target->userid)
            ->set('fullname', 'Budi Santoso Updated')
            ->set('email', 'budi@example.com')
            ->set('formRole', Role::CHECKER)
            ->call('saveEdit')
            ->assertHasNoErrors()
            ->assertSet('showEdit', false);

        $target->refresh();

        $this->assertSame('Budi Santoso Updated', $target->fullname);
        $this->assertSame('budi@example.com', $target->email);
        $this->assertSame(Role::CHECKER, $target->role);
    }

    public function test_admin_cannot_change_own_role(): void
    {
        $admin = $this->makeUser(['role' => Role::ADMIN]);

        Livewire::actingAs($admin)
            ->test(UserManager::class)
            ->call('openEdit', $admin->userid)
            ->set('formRole', Role::INSPECTOR)
            ->call('saveEdit')
            ->assertHasErrors('formRole');

        $this->assertSame(Role::ADMIN, $admin->fresh()->role);
    }

    public function test_admin_can_deactivate_and_activate_another_user(): void
    {
        $admin = $this->makeUser(['role' => Role::ADMIN]);
        $target = $this->makeUser();

        Livewire::actingAs($admin)
            ->test(UserManager::class)
            ->call('confirmToggle', $target->userid)
            ->call('toggleActive')
            ->assertHasNoErrors();

        $this->assertFalse($target->fresh()->active);

        Livewire::actingAs($admin)
            ->test(UserManager::class)
            ->call('confirmToggle', $target->userid)
            ->call('toggleActive')
            ->assertHasNoErrors();

        $this->assertTrue($target->fresh()->active);
    }

    public function test_admin_cannot_deactivate_self(): void
    {
        $admin = $this->makeUser(['role' => Role::ADMIN]);

        Livewire::actingAs($admin)
            ->test(UserManager::class)
            ->call('confirmToggle', $admin->userid)
            ->call('toggleActive')
            ->assertHasErrors('toggle');

        $this->assertTrue($admin->fresh()->active);
    }

    public function test_admin_resets_another_user_password(): void
    {
        $admin = $this->makeUser(['role' => Role::ADMIN]);
        $target = $this->makeUser();
        $oldHash = $target->password_hash;

        Livewire::actingAs($admin)
            ->test(UserManager::class)
            ->call('confirmReset', $target->userid)
            ->call('resetPassword')
            ->assertHasNoErrors();

        $target->refresh();
        $password = session('temporary_password');

        $this->assertNotSame($oldHash, $target->password_hash);
        $this->assertTrue($target->must_change_password);
        $this->assertIsString($password);
        $this->assertTrue(Hash::check($password, $target->password_hash));
    }

    public function test_admin_cannot_reset_own_password(): void
    {
        $admin = $this->makeUser(['role' => Role::ADMIN]);
        $oldHash = $admin->password_hash;

        Livewire::actingAs($admin)
            ->test(UserManager::class)
            ->call('confirmReset', $admin->userid)
            ->call('resetPassword')
            ->assertHasErrors('reset');

        $this->assertSame($oldHash, $admin->fresh()->password_hash);
    }
}
