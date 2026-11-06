@extends('layouts.app')

@section('title', 'Change password')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/profile.css') }}?v={{ filemtime(public_path('css/profile.css')) }}">
@endpush

@push('scripts')
    <script src="{{ asset('js/password-toggle.js') }}?v={{ filemtime(public_path('js/password-toggle.js')) }}" defer></script>
    <script src="{{ asset('js/password-requirements.js') }}?v={{ filemtime(public_path('js/password-requirements.js')) }}" defer></script>
@endpush

@section('content')
    <div class="account-page">
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

        @include('auth.partials.password-form')
    </div>
@endsection
