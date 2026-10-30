@extends('layouts.app')

@section('title', 'Profile')

@section('content')
    @php($user = auth()->user())

    <x-ui.page-header
        title="Profile settings"
        description="Update your photo, name, email address and theme preference."
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

    <div class="card card-narrow">
        <form method="POST" action="{{ route('profile.update') }}" class="form" enctype="multipart/form-data">
            @csrf
            @method('PUT')

            <div class="avatar-field">
                <x-user-avatar :user="$user" :size="72" />

                <div class="avatar-field-body">
                    <span class="label">Profile photo</span>
                    <input
                        class="input avatar-input"
                        type="file"
                        name="avatar"
                        accept="image/jpeg,image/png,image/webp"
                    >
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

            <x-ui.field label="Username" for="profile-username">
                <input id="profile-username" class="input" type="text" value="{{ $user->username }}" disabled>
            </x-ui.field>

            <x-ui.field label="Role" for="profile-role">
                <input id="profile-role" class="input" type="text" value="{{ $user->roleLabel() }}" disabled>
            </x-ui.field>

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

            <x-ui.field label="Theme" for="profile-theme" name="theme">
                <select id="profile-theme" class="select" name="theme" required>
                    <option value="light" @selected(old('theme', $user->theme) === 'light')>Light</option>
                    <option value="dark" @selected(old('theme', $user->theme) === 'dark')>Dark</option>
                    <option value="system" @selected(old('theme', $user->theme) === 'system')>System</option>
                </select>
            </x-ui.field>

            <div class="form-actions">
                <x-ui.button variant="primary" type="submit" icon="save">Save changes</x-ui.button>
                <x-ui.button :href="route('password.change')" icon="key">Change password</x-ui.button>
            </div>
        </form>
    </div>
@endsection
