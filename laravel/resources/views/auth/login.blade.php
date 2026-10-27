@extends('layouts.guest')

@section('title', 'Sign in')

@section('content')
    <div class="auth-heading">
        <h1 class="auth-title" id="login-title">Sign in</h1>
        <p class="auth-subtitle">Please Enter Your Detail</p>
    </div>

    @if ($errors->any())
        <div class="alert alert-error auth-alert" role="alert">
            <ul>
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <form method="POST" action="{{ route('login.store') }}" class="auth-form">
        @csrf

        <div class="auth-field">
            <label class="auth-label" for="username">Username</label>
            <div class="auth-input-wrap">
                <svg class="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="3.5"></circle>
                    <path d="M4.5 20a7.5 7.5 0 0 1 15 0"></path>
                </svg>
                <input
                    class="auth-input @error('username') auth-input-error @enderror"
                    id="username"
                    type="text"
                    name="username"
                    value="{{ old('username') }}"
                    placeholder="Enter your username"
                    autocomplete="username"
                    autocapitalize="none"
                    spellcheck="false"
                    maxlength="50"
                    required
                >
            </div>
        </div>

        <div class="auth-field">
            <label class="auth-label" for="password">Password</label>
            <div class="auth-input-wrap">
                <svg class="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="5" y="10" width="14" height="10" rx="2"></rect>
                    <path d="M8 10V7a4 4 0 0 1 8 0v3"></path>
                </svg>
                <input
                    class="auth-input @error('password') auth-input-error @enderror"
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    autocomplete="current-password"
                    required
                >
                <button
                    class="auth-eye"
                    type="button"
                    data-password-toggle
                    aria-label="Show password"
                    aria-pressed="false"
                >
                    <svg class="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M2.25 12S6 5.25 12 5.25 21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <svg class="eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" hidden>
                        <path d="M3 3l18 18"></path>
                        <path d="M10.6 5.4A10.8 10.8 0 0 1 12 5.25c6 0 9.75 6.75 9.75 6.75a18.5 18.5 0 0 1-2.35 3.15"></path>
                        <path d="M6.6 6.6A18.6 18.6 0 0 0 2.25 12S6 18.75 12 18.75a10.6 10.6 0 0 0 4.2-.9"></path>
                        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"></path>
                    </svg>
                </button>
            </div>
            <p class="caps-warning" id="caps-warning" role="status" aria-live="polite" hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 4.5 21 20H3L12 4.5Z"></path>
                    <path d="M12 9v5"></path>
                    <path d="M12 17h.01"></path>
                </svg>
                Caps Lock is on.
            </p>
        </div>

        <button class="auth-submit" type="submit">Sign in</button>
    </form>

    <p class="auth-help">Need access? Contact your system administrator.</p>
@endsection

@push('scripts')
    <script>
        (() => {
            const password = document.getElementById('password');
            const toggle = document.querySelector('[data-password-toggle]');
            const eyeOpen = toggle?.querySelector('.eye-open');
            const eyeClosed = toggle?.querySelector('.eye-closed');
            const warning = document.getElementById('caps-warning');

            if (!password || !toggle) {
                return;
            }

            if (window.matchMedia('(min-width: 720px)').matches) {
                document.getElementById('username')?.focus({ preventScroll: true });
            }

            toggle.addEventListener('click', () => {
                const show = password.type === 'password';

                password.type = show ? 'text' : 'password';
                toggle.setAttribute('aria-pressed', String(show));
                toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');

                if (eyeOpen && eyeClosed) {
                    eyeOpen.hidden = show;
                    eyeClosed.hidden = !show;
                }

                password.focus();
            });

            const updateCapsLock = (event) => {
                if (!warning) {
                    return;
                }

                const active = typeof event.getModifierState === 'function'
                    && event.getModifierState('CapsLock');

                warning.hidden = !active;
            };

            password.addEventListener('keydown', updateCapsLock);
            password.addEventListener('keyup', updateCapsLock);
            password.addEventListener('blur', () => {
                if (warning) {
                    warning.hidden = true;
                }
            });
        })();
    </script>
@endpush
