@extends('layouts.app')

@section('title', 'Profile')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/profile.css') }}?v={{ filemtime(public_path('css/profile.css')) }}">
@endpush

@push('scripts')
    <script src="{{ asset('js/profile-form.js') }}?v={{ filemtime(public_path('js/profile-form.js')) }}" defer></script>
    <script src="{{ asset('js/password-toggle.js') }}?v={{ filemtime(public_path('js/password-toggle.js')) }}" defer></script>
    <script src="{{ asset('js/password-requirements.js') }}?v={{ filemtime(public_path('js/password-requirements.js')) }}" defer></script>
    <script src="{{ asset('js/password-modal.js') }}?v={{ filemtime(public_path('js/password-modal.js')) }}" defer></script>
@endpush

@section('content')
    @php
        $user = auth()->user();
    @endphp

    <div class="account-page">
        <x-ui.page-header
            eyebrow="Account center"
            title="Profile settings"
            description="Manage your identity, profile photo, and interface preferences."
        />

        @if ($errors->any())
            <x-ui.alert variant="error">
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </x-ui.alert>
        @endif

        <section class="card profile-overview">
            <div class="profile-overview-identity">
                <x-user-avatar :user="$user" :size="64" class="profile-overview-avatar" />
                <div class="profile-overview-copy">
                    <h2>{{ $user->fullname }}</h2>
                    <div class="profile-overview-line">
                        <x-ui.role-badge :role="$user->role" />
                        <span>{{ $user->email ?: 'No email address set' }}</span>
                    </div>
                </div>
            </div>

            <div class="profile-overview-meta">
                <div>
                    <span>Username</span>
                    <strong>{{ $user->username }}</strong>
                </div>
                <div>
                    <span>Status</span>
                    <x-ui.status-badge :active="$user->active" />
                </div>
                <div>
                    <span>Member since</span>
                    <strong>{{ $user->created_at ? \Illuminate\Support\Carbon::parse($user->created_at)->format('M Y') : '—' }}</strong>
                </div>
            </div>

            <x-ui.button type="button" icon="key" data-open-password-modal>
                Change password
            </x-ui.button>
        </section>

        <form
            method="POST"
            action="{{ route('profile.update') }}"
            class="profile-settings-form"
            enctype="multipart/form-data"
            data-profile-form
            data-theme-endpoint="{{ route('profile.theme') }}"
        >
            @csrf
            @method('PUT')

            <section class="card account-card">
                <div class="account-section-head">
                    <span class="account-section-icon">
                        <x-icon name="user" :size="18" />
                    </span>
                    <div>
                        <h2>Personal details</h2>
                        <p>How your name and contact email appear across the application.</p>
                    </div>
                </div>

                <div class="account-fields-grid">
                    <x-ui.field label="Full name" for="profile-fullname" name="fullname">
                        <input
                            id="profile-fullname"
                            class="input"
                            type="text"
                            name="fullname"
                            value="{{ old('fullname', $user->fullname) }}"
                            maxlength="50"
                            required
                        >
                    </x-ui.field>

                    <x-ui.field label="Email" for="profile-email" name="email">
                        <input
                            id="profile-email"
                            class="input"
                            type="email"
                            name="email"
                            value="{{ old('email', $user->email) }}"
                            maxlength="100"
                            placeholder="Optional"
                        >
                    </x-ui.field>
                </div>

                <div class="account-readonly-grid">
                    <x-ui.field label="Username" for="profile-username">
                        <input id="profile-username" class="input" type="text" value="{{ $user->username }}" disabled>
                    </x-ui.field>

                    <x-ui.field label="Role" for="profile-role">
                        <input id="profile-role" class="input" type="text" value="{{ $user->roleLabel() }}" disabled>
                    </x-ui.field>
                </div>
            </section>

            <section class="card account-card">
                <div class="account-section-head">
                    <span class="account-section-icon">
                        <x-icon name="camera" :size="18" />
                    </span>
                    <div>
                        <h2>Profile photo</h2>
                        <p>A clear photo helps your teammates recognize you.</p>
                    </div>
                </div>

                <div class="account-photo-editor">
                    <x-user-avatar :user="$user" :size="80" />

                    <div class="account-photo-actions">
                        <input
                            id="profile-avatar"
                            class="profile-file-input"
                            type="file"
                            name="avatar"
                            accept="image/jpeg,image/png,image/webp"
                            data-profile-avatar
                        >
                        <label class="btn profile-file-button" for="profile-avatar">
                            <x-icon name="upload" :size="16" />
                            Choose photo
                        </label>
                        <p class="field-hint">JPG, PNG or WebP. Maximum 2 MB.</p>
                        <p class="profile-avatar-status" data-profile-avatar-status role="status" aria-live="polite"></p>

                        @if ($user->avatar_path)
                            <label class="check-field">
                                <input type="checkbox" name="remove_avatar" value="1" @checked(old('remove_avatar'))>
                                <span>Remove current photo</span>
                            </label>
                        @endif

                        @error('avatar')
                            <p class="field-error">{{ $message }}</p>
                        @enderror
                    </div>
                </div>
            </section>

            <section class="card account-card">
                <div class="account-section-head">
                    <span class="account-section-icon">
                        <x-icon name="sun" :size="18" />
                    </span>
                    <div>
                        <h2>Appearance</h2>
                        <p>Choose how the interface looks on this account. Changes apply immediately.</p>
                    </div>
                </div>

                <div class="account-theme-options">
                    <label class="account-theme-option">
                        <input type="radio" name="theme" value="light" @checked(old('theme', $user->theme) === 'light')>
                        <span class="account-theme-icon"><x-icon name="sun" :size="17" /></span>
                        <span class="account-theme-copy">
                            <strong>Light</strong>
                            <small>Bright and clean</small>
                        </span>
                        <span class="account-theme-check"><x-icon name="check" :size="13" /></span>
                    </label>

                    <label class="account-theme-option">
                        <input type="radio" name="theme" value="dark" @checked(old('theme', $user->theme) === 'dark')>
                        <span class="account-theme-icon"><x-icon name="moon" :size="17" /></span>
                        <span class="account-theme-copy">
                            <strong>Dark</strong>
                            <small>Low-light workspace</small>
                        </span>
                        <span class="account-theme-check"><x-icon name="check" :size="13" /></span>
                    </label>

                    <label class="account-theme-option">
                        <input type="radio" name="theme" value="system" @checked(old('theme', $user->theme) === 'system')>
                        <span class="account-theme-icon"><x-icon name="monitor" :size="17" /></span>
                        <span class="account-theme-copy">
                            <strong>System</strong>
                            <small>Follow device setting</small>
                        </span>
                        <span class="account-theme-check"><x-icon name="check" :size="13" /></span>
                    </label>
                </div>

                <p class="profile-theme-status" data-profile-theme-status role="status" aria-live="polite"></p>

                @error('theme')
                    <p class="field-error">{{ $message }}</p>
                @enderror
            </section>

            <div class="account-actions">
                <x-ui.button variant="primary" type="submit" icon="save">Save changes</x-ui.button>
            </div>
        </form>

        @php
            $passwordModalOpen = $errors->has('current_password')
                || $errors->has('password')
                || $errors->has('password_confirmation');
        @endphp

        <div
            class="password-modal-backdrop"
            data-password-modal
            @if ($passwordModalOpen) data-auto-open="true" @endif
            hidden
        >
            <div class="password-modal" role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
                <div class="password-modal-head">
                    <div>
                        <span class="account-kicker">Account center</span>
                        <h2 id="password-modal-title">Change password</h2>
                    </div>

                    <button
                        type="button"
                        class="icon-btn"
                        data-close-password-modal
                        data-tooltip="Close dialog"
                        aria-label="Close change password dialog"
                    >
                        <x-icon name="x" :size="18" />
                    </button>
                </div>

                <div class="password-modal-body">
                    @include('auth.partials.password-form')
                </div>
            </div>
        </div>
    </div>
@endsection
