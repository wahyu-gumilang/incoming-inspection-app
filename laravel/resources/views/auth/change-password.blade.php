@extends('layouts.app')

@section('title', 'Change password')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/profile.css') }}?v={{ filemtime(public_path('css/profile.css')) }}">
@endpush

@push('scripts')
    <script>
        (() => {
            document.querySelectorAll("[data-password-toggle]").forEach((button) => {
                const input = document.getElementById(button.dataset.passwordTarget);

                if (!input) {
                    return;
                }

                button.addEventListener("click", () => {
                    const visible = input.type === "text";
                    const show = button.querySelector("[data-password-show]");
                    const hide = button.querySelector("[data-password-hide]");

                    input.type = visible ? "password" : "text";
                    button.setAttribute("aria-pressed", String(!visible));
                    button.setAttribute("aria-label", visible ? "Show password" : "Hide password");

                    if (show && hide) {
                        show.hidden = !visible;
                        hide.hidden = visible;
                    }
                });
            });
        })();
    </script>
@endpush

@section('content')
    <div class="account-page account-page-narrow">
        <x-ui.page-header
            eyebrow="Account center"
            title="Change password"
            description="Update the password used to access your account."
        >
            <x-slot:actions>
                <x-ui.button :href="route('profile.edit')" icon="undo-2">Back to profile</x-ui.button>
            </x-slot:actions>
        </x-ui.page-header>

        @if (auth()->user()->must_change_password)
            <x-ui.alert variant="info">
                Your account is using a temporary password. Set a new password to continue.
            </x-ui.alert>
        @endif

        <div class="password-layout">
            <aside class="password-panel">
                <span class="password-panel-glow" aria-hidden="true"></span>
                <span class="password-panel-icon">
                    <x-icon name="shield" :size="26" />
                </span>
                <span class="password-panel-kicker">Security center</span>
                <h2>Keep your account protected</h2>
                <p>
                    Choose a password that is unique to this account and not reused anywhere else.
                </p>

                <ul class="password-requirements">
                    <li><x-icon name="check" :size="14" /> At least 8 characters</li>
                    <li><x-icon name="check" :size="14" /> Maximum 72 characters</li>
                    <li><x-icon name="check" :size="14" /> Unique to this account</li>
                    <li><x-icon name="check" :size="14" /> Stored securely as a hash</li>
                </ul>
            </aside>

            <section class="card password-form-card">
                <div class="account-section-head">
                    <span class="account-section-icon">
                        <x-icon name="key" :size="18" />
                    </span>
                    <div>
                        <h2>Update your password</h2>
                        <p>Enter your current password, then choose a new one.</p>
                    </div>
                </div>

                <form method="POST" action="{{ route('password.update') }}" class="form">
                    @csrf

                    <x-ui.field label="Current password" for="current-password" name="current_password">
                        <div class="password-input-wrap">
                            <input
                                id="current-password"
                                class="input"
                                type="password"
                                name="current_password"
                                autocomplete="current-password"
                                required
                            >
                            <button
                                class="password-toggle"
                                type="button"
                                data-password-toggle
                                data-password-target="current-password"
                                aria-label="Show password"
                                aria-pressed="false"
                            >
                                <span data-password-show><x-icon name="eye" :size="16" /></span>
                                <span data-password-hide hidden><x-icon name="eye-off" :size="16" /></span>
                            </button>
                        </div>
                    </x-ui.field>

                    <x-ui.field label="New password" for="new-password" name="password">
                        <div class="password-input-wrap">
                            <input
                                id="new-password"
                                class="input"
                                type="password"
                                name="password"
                                autocomplete="new-password"
                                minlength="8"
                                maxlength="72"
                                required
                            >
                            <button
                                class="password-toggle"
                                type="button"
                                data-password-toggle
                                data-password-target="new-password"
                                aria-label="Show password"
                                aria-pressed="false"
                            >
                                <span data-password-show><x-icon name="eye" :size="16" /></span>
                                <span data-password-hide hidden><x-icon name="eye-off" :size="16" /></span>
                            </button>
                        </div>
                    </x-ui.field>

                    <x-ui.field label="Confirm new password" for="confirm-password" name="password_confirmation">
                        <div class="password-input-wrap">
                            <input
                                id="confirm-password"
                                class="input"
                                type="password"
                                name="password_confirmation"
                                autocomplete="new-password"
                                minlength="8"
                                maxlength="72"
                                required
                            >
                            <button
                                class="password-toggle"
                                type="button"
                                data-password-toggle
                                data-password-target="confirm-password"
                                aria-label="Show password"
                                aria-pressed="false"
                            >
                                <span data-password-show><x-icon name="eye" :size="16" /></span>
                                <span data-password-hide hidden><x-icon name="eye-off" :size="16" /></span>
                            </button>
                        </div>
                    </x-ui.field>

                    <div class="account-actions">
                        <x-ui.button variant="primary" type="submit" icon="save">Update password</x-ui.button>
                    </div>
                </form>
            </section>
        </div>
    </div>
@endsection
