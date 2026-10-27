<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use DatabaseTransactions;

    public function test_login_page_is_available_to_guests(): void
    {
        $this->get('/login')
            ->assertOk()
            ->assertSee('Sign in');
    }

    public function test_active_user_can_sign_in(): void
    {
        $user = $this->makeUser();

        $response = $this->post('/login', [
            'username' => $user->username,
            'password' => 'Test-pass-123',
        ]);

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->fresh()->last_login_at);
    }

    public function test_guest_is_redirected_from_the_dashboard(): void
    {
        $this->get('/')->assertRedirect('/login');
    }

    public function test_wrong_password_is_rejected(): void
    {
        $user = $this->makeUser();

        $response = $this->from('/login')->post('/login', [
            'username' => $user->username,
            'password' => 'wrong-password',
        ]);

        $response->assertRedirect('/login');
        $response->assertSessionHasErrors('username');
        $this->assertGuest();
    }

    public function test_inactive_user_cannot_sign_in(): void
    {
        $user = $this->makeUser(['active' => false]);

        $response = $this->from('/login')->post('/login', [
            'username' => $user->username,
            'password' => 'Test-pass-123',
        ]);

        $response->assertRedirect('/login');
        $response->assertSessionHasErrors('username');
        $this->assertGuest();
    }

    public function test_login_is_rate_limited_after_five_failures(): void
    {
        $user = $this->makeUser();

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->post('/login', [
                'username' => $user->username,
                'password' => 'wrong-password',
            ]);
        }

        $response = $this->from('/login')->post('/login', [
            'username' => $user->username,
            'password' => 'Test-pass-123',
        ]);

        $response->assertRedirect('/login');
        $response->assertSessionHasErrors('username');
        $this->assertGuest();
        $this->assertStringContainsString(
            'Too many login attempts',
            (string) session('errors')->first('username'),
        );
    }

    public function test_authenticated_user_can_sign_out(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user)
            ->post('/logout')
            ->assertRedirect('/login');

        $this->assertGuest();
    }
}
