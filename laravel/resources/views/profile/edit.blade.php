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

    <div class="profile-page">
        <x-ui.page-header
            eyebrow="Account"
            title="Profile settings"
            description="Update your photo and personal account details."
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

        <div class="profile-editor-card card">
            <aside class="profile-photo-panel">
                <x-user-avatar :user="$user" :size="104" class="profile-photo-avatar" data-avatar-preview />

                <div class="profile-photo-copy">
                    <h2>Profile photo</h2>
                    <p>Drop an image, adjust the crop, then save.</p>
                </div>

                <input
                    id="profile-avatar"
                    class="profile-file-input"
                    type="file"
                    name="avatar"
                    accept="image/jpeg,image/png,image/webp"
                    form="profile-form"
                    data-profile-avatar
                >

                <label class="profile-dropzone" for="profile-avatar" data-profile-dropzone>
                    <x-icon name="upload" :size="18" />
                    <strong>Drop a photo here</strong>
                    <span>or click to browse</span>
                    <small>JPG, PNG, WebP · max 5 MB</small>
                </label>

                <p class="profile-avatar-status" data-profile-avatar-status role="status" aria-live="polite"></p>

                @if ($user->avatar_path)
                    <label class="check-field">
                        <input type="checkbox" name="remove_avatar" value="1" form="profile-form" @checked(old('remove_avatar'))>
                        <span>Remove current photo</span>
                    </label>
                @endif

                @error('avatar')
                    <p class="field-error">{{ $message }}</p>
                @enderror
            </aside>

            <form
                id="profile-form"
                method="POST"
                action="{{ route('profile.update') }}"
                class="profile-details-panel"
                enctype="multipart/form-data"
                data-profile-form
            >
                @csrf
                @method('PUT')

                <div class="profile-details-head">
                    <div>
                        <span class="profile-details-kicker">Account details</span>
                        <h2>Personal information</h2>
                        <p>These details appear on your profile and inspection records.</p>
                    </div>
                    <x-ui.role-badge :role="$user->role" />
                </div>

                <div class="profile-fields">
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

                    <x-ui.field label="Username" for="profile-username">
                        <input id="profile-username" class="input" type="text" value="{{ $user->username }}" disabled>
                    </x-ui.field>

                    <x-ui.field label="Status" for="profile-status">
                        <div class="profile-status-field">
                            <x-ui.status-badge :active="$user->active" />
                            <span>Member since {{ $user->created_at ? \Illuminate\Support\Carbon::parse($user->created_at)->format('M Y') : '—' }}</span>
                        </div>
                    </x-ui.field>
                </div>

                <div class="profile-security-row">
                    <div class="profile-security-copy">
                        <span class="profile-security-icon"><x-icon name="shield" :size="18" /></span>
                        <div>
                            <strong>Account security</strong>
                            <span>Change the password used to sign in to this account.</span>
                        </div>
                    </div>
                    <x-ui.button type="button" icon="key" data-open-password-modal>
                        Change password
                    </x-ui.button>
                </div>

                <div class="profile-savebar">
                    <x-ui.button variant="primary" type="submit" icon="save">Save changes</x-ui.button>
                </div>
            </form>
        </div>

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

        <div class="crop-modal-backdrop" data-crop-modal hidden>
            <div class="crop-modal" role="dialog" aria-modal="true" aria-labelledby="crop-modal-title">
                <div class="crop-modal-head">
                    <div>
                        <span class="account-kicker">Profile photo</span>
                        <h2 id="crop-modal-title">Crop your photo</h2>
                    </div>
                    <button type="button" class="icon-btn" data-crop-cancel data-tooltip="Close dialog" aria-label="Close crop dialog">
                        <x-icon name="x" :size="18" />
                    </button>
                </div>

                <div class="crop-stage">
                    <div class="crop-viewport" data-crop-viewport>
                        <img data-crop-image alt="" draggable="false">
                    </div>
                </div>

                <div class="crop-controls">
                    <label class="crop-zoom">
                        <span>Zoom</span>
                        <input type="range" min="1" max="3" step="0.01" value="1" data-crop-zoom>
                    </label>
                    <button type="button" class="crop-reset" data-crop-reset>Reset</button>
                </div>

                <p class="crop-hint">Drag the photo to reposition it inside the circle.</p>

                <div class="crop-actions">
                    <x-ui.button variant="secondary" type="button" data-crop-cancel>Cancel</x-ui.button>
                    <x-ui.button variant="primary" type="button" data-crop-apply>Apply photo</x-ui.button>
                </div>
            </div>
        </div>
    </div>
@endsection
