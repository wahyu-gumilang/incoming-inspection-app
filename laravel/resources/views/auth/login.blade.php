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

    <div class="alert alert-error auth-alert" id="client-error" role="alert" hidden>
        <ul>
            <li id="client-error-message"></li>
        </ul>
    </div>

    <form method="POST" action="{{ route('login.store') }}" class="auth-form" autocomplete="on" novalidate>
        @csrf

        <div class="auth-field">
            <label class="auth-label" for="username">Username</label>
            <div class="auth-input-wrap @error('username') auth-input-wrap-error @enderror">
                <svg class="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="3.5"></circle>
                    <path d="M4.5 20a7.5 7.5 0 0 1 15 0"></path>
                </svg>
                <input
                    class="auth-input @error('username') auth-input-error @enderror"
                    id="username"
                    type="text"
                    name="username"
                    value="{{ old('username', $rememberedUsername ?? '') }}"
                    placeholder="Enter your username"
                    autocomplete="username"
                    autocapitalize="none"
                    spellcheck="false"
                    maxlength="50"
                    @error('username') aria-invalid="true" @enderror
                    required
                >
            </div>
        </div>

        <div class="auth-field">
            <label class="auth-label" for="password">Password</label>
            <div class="auth-input-wrap @if ($errors->has('username') || $errors->has('password')) auth-input-wrap-error @endif">
                <svg class="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="5" y="10" width="14" height="10" rx="2"></rect>
                    <path d="M8 10V7a4 4 0 0 1 8 0v3"></path>
                </svg>
                <input
                    class="auth-input @if ($errors->has('username') || $errors->has('password')) auth-input-error @endif"
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    autocomplete="current-password"
                    @if ($errors->has('username') || $errors->has('password')) aria-invalid="true" @endif
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
        </div>

        <div class="auth-options">
            <label class="auth-remember">
                <input id="remember" type="checkbox" name="remember" value="1" @checked(old('remember'))>
                <span class="auth-remember-box" aria-hidden="true">
                    <svg viewBox="0 0 16 16" fill="none" focusable="false">
                        <path d="M3 8.5 6.2 11.7 13 4.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                </span>
                <span class="auth-remember-text">Remember me</span>
            </label>
        </div>

        <button class="auth-submit" type="submit">
            <span class="auth-submit-loader" aria-hidden="true">
                <span class="auth-submit-loader-ring"></span>
                <span class="auth-submit-loader-core"></span>
            </span>
            <span class="auth-submit-label">Sign in</span>
            <span class="auth-submit-loading-label">Signing in</span>
        </button>
    </form>

    <span class="auth-status" id="login-status" role="status" aria-live="polite"></span>

    <p class="auth-help">Need access? Contact your system administrator.</p>
@endsection

@push('scripts')
    <script>
        (() => {
            const form = document.querySelector('.auth-form');
            const username = document.getElementById('username');
            const password = document.getElementById('password');
            const toggle = document.querySelector('[data-password-toggle]');
            const eyeOpen = toggle?.querySelector('.eye-open');
            const eyeClosed = toggle?.querySelector('.eye-closed');
            const clientError = document.getElementById('client-error');
            const clientErrorMessage = document.getElementById('client-error-message');

            if (!form || !username || !password) {
                return;
            }

            const submitButton = form.querySelector('.auth-submit');
            const remember = form.querySelector('input[name="remember"]');
            const loginStatus = document.getElementById('login-status');
            let submitting = false;
            let nativeSubmit = false;

            const setLoading = (loading) => {
                submitting = loading;
                form.classList.toggle('is-loading', loading);
                form.setAttribute('aria-busy', loading ? 'true' : 'false');
                submitButton?.classList.toggle('is-loading', loading);

                [username, password].forEach((input) => {
                    input.tabIndex = loading ? -1 : 0;

                    if (loading) {
                        input.setAttribute('aria-disabled', 'true');
                        input.blur();
                    } else {
                        input.removeAttribute('aria-disabled');
                    }
                });

                if (toggle) {
                    toggle.disabled = loading;
                }

                if (remember) {
                    remember.tabIndex = loading ? -1 : 0;

                    if (loading) {
                        remember.setAttribute('aria-disabled', 'true');
                        remember.blur();
                    } else {
                        remember.removeAttribute('aria-disabled');
                    }
                }

                if (submitButton) {
                    submitButton.disabled = loading;
                }

                if (loginStatus) {
                    loginStatus.textContent = loading ? 'Signing in' : '';
                }
            };

            if (window.matchMedia('(min-width: 720px)').matches) {
                username.focus({ preventScroll: true });
            }

            const setInputError = (input, invalid) => {
                const wrapper = input.closest('.auth-input-wrap');

                input.classList.remove('auth-input-error');
                wrapper?.classList.remove('auth-input-wrap-error');

                if (invalid) {
                    void input.offsetWidth;
                    input.classList.add('auth-input-error');
                    wrapper?.classList.add('auth-input-wrap-error');
                    input.setAttribute('aria-invalid', 'true');
                } else {
                    input.removeAttribute('aria-invalid');
                }
            };

            const hideClientErrorWhenReady = () => {
                if (username.value.trim() && password.value && clientError) {
                    clientError.hidden = true;
                }
            };

            form.addEventListener('submit', (event) => {
                if (nativeSubmit) {
                    nativeSubmit = false;

                    return;
                }

                if (submitting) {
                    event.preventDefault();

                    return;
                }

                const usernameEmpty = username.value.trim() === '';
                const passwordEmpty = password.value === '';

                if (!usernameEmpty && !passwordEmpty) {
                    event.preventDefault();
                    setLoading(true);

                    // Let the browser paint the loading state before navigating.
                    window.setTimeout(() => {
                        try {
                            nativeSubmit = true;
                            form.requestSubmit();
                        } catch {
                            nativeSubmit = false;
                            form.submit();
                        }
                    }, 450);

                    return;
                }

                event.preventDefault();
                setInputError(username, usernameEmpty);
                setInputError(password, passwordEmpty);

                if (clientError && clientErrorMessage) {
                    clientErrorMessage.textContent = usernameEmpty && passwordEmpty
                        ? 'Please enter your username and password.'
                        : usernameEmpty
                            ? 'Please enter your username.'
                            : 'Please enter your password.';
                    clientError.hidden = false;
                }

                (usernameEmpty ? username : password).focus({ preventScroll: true });
            });

            username.addEventListener('input', () => {
                if (username.value.trim()) {
                    setInputError(username, false);
                    hideClientErrorWhenReady();
                }
            });

            password.addEventListener('input', () => {
                if (password.value) {
                    setInputError(password, false);
                    hideClientErrorWhenReady();
                }
            });

            window.addEventListener('pageshow', () => setLoading(false));

            if (!toggle) {
                return;
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
        })();
    </script>
@endpush
