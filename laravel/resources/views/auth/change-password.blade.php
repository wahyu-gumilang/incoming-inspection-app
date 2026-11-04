@extends('layouts.app')

@section('title', 'Change password')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/profile.css') }}?v={{ filemtime(public_path('css/profile.css')) }}">
@endpush

@section('content')
    <div class="settings-page">
        <x-ui.page-header
            eyebrow="Account"
            title="Change password"
            description="Set a new password for your account. It applies immediately after saving."
        />

        <x-settings-tabs active="password" />

        @if (auth()->user()->must_change_password)
            <x-ui.alert variant="info">
                Your account is using a temporary password. Set a new password to continue.
            </x-ui.alert>
        @endif

        <div class="settings-shell settings-shell-narrow">
            <section class="card password-card">
                <div class="settings-section-head">
                    <span class="settings-section-icon">
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
                        <input
                            id="current-password"
                            class="input"
                            type="password"
                            name="current_password"
                            autocomplete="current-password"
                            required
                        >
                    </x-ui.field>

                    <x-ui.field label="New password" for="new-password" name="password">
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
                    </x-ui.field>

                    <x-ui.field label="Confirm new password" for="confirm-password" name="password_confirmation">
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
                    </x-ui.field>

                    <div class="password-guidance">
                        <span><x-icon name="check" :size="14" /> At least 8 characters</span>
                        <span><x-icon name="check" :size="14" /> Maximum 72 characters</span>
                        <span><x-icon name="check" :size="14" /> Use a unique password</span>
                    </div>

                    <div class="settings-actions">
                        <x-ui.button variant="primary" type="submit" icon="save">Update password</x-ui.button>
                    </div>
                </form>
            </section>
        </div>
    </div>
@endsection
