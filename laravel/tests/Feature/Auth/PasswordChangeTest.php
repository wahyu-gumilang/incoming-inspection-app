<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class PasswordChangeTest extends TestCase
{
    use DatabaseTransactions;

    public function test_temporary_password_user_must_change_password_before_using_the_app(): void
    {
        $user = $this->makeUser(['must_change_password' => true]);

        $login = $this->post('/login', [
            'username' => $user->username,
            'password' => 'Test-pass-123',
        ]);

        $login->assertRedirect(route('password.change'));
        $this->assertAuthenticatedAs($user);

        $this->get(route('dashboard'))->assertRedirect(route('password.change'));
        $this->get('/items')->assertRedirect(route('password.change'));

        $change = $this->post('/change-password', [
            'current_password' => 'Test-pass-123',
            'password' => 'New-pass-123',
            'password_confirmation' => 'New-pass-123',
        ]);

        $change->assertRedirect(route('dashboard'));
        $this->assertFalse($user->fresh()->must_change_password);
        $this->get(route('dashboard'))->assertOk();
    }

    public function test_wrong_current_password_is_rejected(): void
    {
        $user = $this->makeUser();

        $response = $this->actingAs($user)
            ->from('/change-password')
            ->post('/change-password', [
                'current_password' => 'wrong-password',
                'password' => 'New-pass-123',
                'password_confirmation' => 'New-pass-123',
            ]);

        $response->assertRedirect('/change-password');
        $response->assertSessionHasErrors('current_password');
    }

    public function test_password_confirmation_must_match(): void
    {
        $user = $this->makeUser();

        $response = $this->actingAs($user)
            ->from('/change-password')
            ->post('/change-password', [
                'current_password' => 'Test-pass-123',
                'password' => 'New-pass-123',
                'password_confirmation' => 'Different-pass-123',
            ]);

        $response->assertRedirect('/change-password');
        $response->assertSessionHasErrors('password');
    }
}
