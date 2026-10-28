<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

class LoginController extends Controller
{
    private const REMEMBERED_USERNAME = 'remembered_username';

    private const REMEMBERED_USERNAME_MINUTES = 60 * 24 * 400;

    public function show(Request $request): View|RedirectResponse
    {
        if (Auth::check()) {
            return $this->redirectAfterLogin(Auth::user());
        }

        $rememberedUsername = $request->cookie(self::REMEMBERED_USERNAME);

        return view('auth.login', [
            'rememberedUsername' => is_string($rememberedUsername) ? $rememberedUsername : null,
        ]);
    }

    public function login(LoginRequest $request): RedirectResponse
    {
        if (Auth::check()) {
            return $this->redirectAfterLogin(Auth::user());
        }

        $username = $request->string('username')->trim()->toString();
        $password = $request->string('password')->toString();
        $remember = $request->boolean('remember');
        $key = 'login:'.Str::lower($username).'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            $minutes = (int) ceil(RateLimiter::availableIn($key) / 60);

            throw ValidationException::withMessages([
                'username' => 'Too many login attempts. Try again in '.$minutes.' '.Str::plural('minute', $minutes).'.',
            ]);
        }

        if (! Auth::attempt(['username' => $username, 'password' => $password], $remember)) {
            RateLimiter::hit($key, 900);

            throw ValidationException::withMessages([
                'username' => 'These credentials do not match our records.',
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        if (! $user->active) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            RateLimiter::hit($key, 900);

            throw ValidationException::withMessages([
                'username' => 'These credentials do not match our records.',
            ]);
        }

        RateLimiter::clear($key);
        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();

        if ($remember) {
            Cookie::queue(
                self::REMEMBERED_USERNAME,
                $username,
                self::REMEMBERED_USERNAME_MINUTES,
            );
        } else {
            Cookie::queue(Cookie::forget(self::REMEMBERED_USERNAME));
        }

        if ($user->must_change_password) {
            return redirect()->route('password.change');
        }

        return redirect()->intended(route('dashboard'));
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    private function redirectAfterLogin(?User $user): RedirectResponse
    {
        if ($user !== null && $user->must_change_password) {
            return redirect()->route('password.change');
        }

        return redirect()->route('dashboard');
    }
}
