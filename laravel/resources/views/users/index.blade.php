@extends('layouts.app')

@section('title', 'User Management')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/users.css') }}?v={{ filemtime(public_path('css/users.css')) }}">
@endpush

@section('content')
    <livewire:users.user-manager />
@endsection

@push('scripts')
    <script>
        document.addEventListener('click', async (event) => {
            const button = event.target.closest('[data-copy-password]');

            if (!button) {
                return;
            }

            const code = button.closest('.temp-password')?.querySelector('code');

            if (!code || !navigator.clipboard) {
                return;
            }

            try {
                await navigator.clipboard.writeText(code.textContent.trim());
                button.textContent = 'Copied';
                window.setTimeout(() => {
                    button.textContent = 'Copy';
                }, 1500);
            } catch {
                // The password stays visible and selectable when clipboard access is blocked.
            }
        });
    </script>
@endpush
