<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Auth;
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

    public function test_login_page_has_a_loading_state(): void
    {
        $this->get('/login')
            ->assertOk()
            ->assertSee('auth-submit-loader', false)
            ->assertSee('Signing in');
    }

    public function test_remember_me_is_rendered_on_the_login_page(): void
    {
        $this->get('/login')
            ->assertOk()
            ->assertSee('Remember me')
            ->assertSee('name="remember"', false);
    }

    public function test_remember_me_sets_a_persistent_login_token(): void
    {
        $user = $this->makeUser();

        $response = $this->post('/login', [
            'username' => $user->username,
            'password' => 'Test-pass-123',
            'remember' => '1',
        ]);

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->fresh()->remember_token);
        $response->assertCookie(Auth::guard('web')->getRecallerName());
    }

    public function test_login_without_remember_me_does_not_create_a_persistent_token(): void
    {
        $user = $this->makeUser();

        $response = $this->post('/login', [
            'username' => $user->username,
            'password' => 'Test-pass-123',
        ]);

        $response->assertRedirect(route('dashboard'));
        $this->assertNull($user->fresh()->remember_token);
        $response->assertCookieMissing(Auth::guard('web')->getRecallerName());
    }

    public function test_inactive_user_does_not_receive_a_persistent_login_cookie(): void
    {
        $user = $this->makeUser(['active' => false]);

        $response = $this->from('/login')->post('/login', [
            'username' => $user->username,
            'password' => 'Test-pass-123',
            'remember' => '1',
        ]);

        $response->assertRedirect('/login');
        $response->assertSessionHasErrors('username');
        $response->assertCookieMissing(Auth::guard('web')->getRecallerName());
        $this->assertGuest();
    }

    public function test_remember_me_remembers_the_username_after_logout(): void
    {
        $user = $this->makeUser();

        $login = $this->post('/login', [
            'username' => $user->username,
            'password' => 'Test-pass-123',
            'remember' => '1',
        ]);

        $login->assertRedirect(route('dashboard'));
        $login->assertCookie('remembered_username');

        $remembered = $login->getCookie('remembered_username');
        $this->assertNotNull($remembered);

        $this->post('/logout')->assertRedirect('/login');

        $this->withCookie('remembered_username', $remembered->getValue())
            ->get('/login')
            ->assertOk()
            ->assertSee('value="'.$user->username.'"', false);
    }

    public function test_login_without_remember_me_expires_the_remembered_username(): void
    {
        $user = $this->makeUser();

        $this->post('/login', [
            'username' => $user->username,
            'password' => 'Test-pass-123',
            'remember' => '1',
        ])->assertCookie('remembered_username');

        $this->post('/logout');

        $this->assertGuest();

        $response = $this->post('/login', [
            'username' => $user->username,
            'password' => 'Test-pass-123',
        ]);

        $response->assertRedirect(route('dashboard'));
        $response->assertCookieExpired('remembered_username');
    }

    public function test_failed_login_does_not_remember_the_username(): void
    {
        $response = $this->from('/login')->post('/login', [
            'username' => 'unknown-user',
            'password' => 'wrong-password',
            'remember' => '1',
        ]);

        $response->assertRedirect('/login');
        $response->assertCookieMissing('remembered_username');
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
