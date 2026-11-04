@extends('layouts.app')

@section('title', 'Profile')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/profile.css') }}?v={{ filemtime(public_path('css/profile.css')) }}">
@endpush

@section('content')
    @php($user = auth()->user())

    <div class="profile-page">
        <x-ui.page-header
            eyebrow="Account"
            title="Profile settings"
            description="Manage your identity, profile photo, and appearance."
        >
            <x-slot:actions>
                <x-ui.button :href="route('password.change')" icon="key">Change password</x-ui.button>
            </x-slot:actions>
        </x-ui.page-header>

        @if ($errors->any())
            <x-ui.alert variant="error">
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </x-ui.alert>
        @endif

        <div class="profile-layout">
            <aside class="card profile-summary">
                <div class="profile-summary-banner" aria-hidden="true"></div>

                <div class="profile-summary-content">
                    <x-user-avatar :user="$user" :size="88" class="profile-summary-avatar" />

                    <div class="profile-summary-identity">
                        <h2>{{ $user->fullname }}</h2>
                        <p>{{ $user->email ?: 'No email address set' }}</p>
                        <x-ui.role-badge :role="$user->role" />
                    </div>

                    <div class="profile-summary-meta">
                        <div class="profile-summary-meta-row">
                            <span>Username</span>
                            <strong>{{ $user->username }}</strong>
                        </div>
                        <div class="profile-summary-meta-row">
                            <span>Status</span>
                            <x-ui.status-badge :active="$user->active" />
                        </div>
                    </div>

                </div>
            </aside>

            <form method="POST" action="{{ route('profile.update') }}" class="profile-form" enctype="multipart/form-data">
                @csrf
                @method('PUT')

                <section class="card profile-section">
                    <div class="profile-section-head">
                        <span class="profile-section-icon">
                            <x-icon name="camera" :size="18" />
                        </span>
                        <div>
                            <h2>Profile photo</h2>
                            <p>Use a clear photo so your teammates can recognize you.</p>
                        </div>
                    </div>

                    <div class="profile-photo-editor">
                        <x-user-avatar :user="$user" :size="80" />

                        <div class="profile-photo-actions">
                            <input
                                id="profile-avatar"
                                class="profile-file-input"
                                type="file"
                                name="avatar"
                                accept="image/jpeg,image/png,image/webp"
                            >
                            <label class="btn profile-file-button" for="profile-avatar">
                                <x-icon name="upload" :size="16" />
                                Choose photo
                            </label>
                            <p class="field-hint">JPG, PNG or WebP. Maximum 2 MB.</p>

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

                <section class="card profile-section">
                    <div class="profile-section-head">
                        <span class="profile-section-icon">
                            <x-icon name="user" :size="18" />
                        </span>
                        <div>
                            <h2>Personal information</h2>
                            <p>Your display name and contact email.</p>
                        </div>
                    </div>

                    <div class="profile-fields-grid">
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

                    <div class="profile-readonly-grid">
                        <x-ui.field label="Username" for="profile-username">
                            <input id="profile-username" class="input" type="text" value="{{ $user->username }}" disabled>
                        </x-ui.field>

                        <x-ui.field label="Role" for="profile-role">
                            <input id="profile-role" class="input" type="text" value="{{ $user->roleLabel() }}" disabled>
                        </x-ui.field>
                    </div>
                </section>

                <section class="card profile-section">
                    <div class="profile-section-head">
                        <span class="profile-section-icon">
                            <x-icon name="sun" :size="18" />
                        </span>
                        <div>
                            <h2>Appearance</h2>
                            <p>Choose how the interface looks on this account.</p>
                        </div>
                    </div>

                    <div class="profile-theme-options">
                        <label class="profile-theme-option">
                            <input type="radio" name="theme" value="light" @checked(old('theme', $user->theme) === 'light')>
                            <span class="profile-theme-icon"><x-icon name="sun" :size="18" /></span>
                            <span class="profile-theme-copy">
                                <strong>Light</strong>
                                <small>Bright and clean</small>
                            </span>
                        </label>

                        <label class="profile-theme-option">
                            <input type="radio" name="theme" value="dark" @checked(old('theme', $user->theme) === 'dark')>
                            <span class="profile-theme-icon"><x-icon name="moon" :size="18" /></span>
                            <span class="profile-theme-copy">
                                <strong>Dark</strong>
                                <small>Low-light workspace</small>
                            </span>
                        </label>

                        <label class="profile-theme-option">
                            <input type="radio" name="theme" value="system" @checked(old('theme', $user->theme) === 'system')>
                            <span class="profile-theme-icon"><x-icon name="monitor" :size="18" /></span>
                            <span class="profile-theme-copy">
                                <strong>System</strong>
                                <small>Follow device setting</small>
                            </span>
                        </label>
                    </div>

                    @error('theme')
                        <p class="field-error">{{ $message }}</p>
                    @enderror
                </section>

                <div class="profile-actions">
                    <x-ui.button variant="primary" type="submit" icon="save">Save changes</x-ui.button>
                </div>
            </form>
        </div>
    </div>
@endsection
