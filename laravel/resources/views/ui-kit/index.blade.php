@extends('layouts.app')

@section('title', 'UI Kit')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/ui-kit.css') }}?v={{ filemtime(public_path('css/ui-kit.css')) }}">
@endpush

@section('content')
    <x-ui.page-header
        eyebrow="Design system"
        title="UI kit"
        description="Reusable components for every authenticated page. This page is for administrators."
    >
        <x-slot:actions>
            <x-ui.badge variant="info">Admin only</x-ui.badge>
        </x-slot:actions>
    </x-ui.page-header>

    <livewire:ui-kit.preview />
@endsection
