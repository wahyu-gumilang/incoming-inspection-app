@extends('layouts.app')

@section('title', $title)

@section('content')
    <x-ui.page-header
        eyebrow="Module"
        :title="$title"
        :description="$description"
    />

    <div class="card module-placeholder">
        <span class="module-placeholder-icon">
            <x-icon :name="$icon" :size="30" />
        </span>
        <h2>Coming next</h2>
        <p>
            This module is wired into the new navigation. The page is ready for its feature work
            in the next phase of the PHP migration.
        </p>
        <x-ui.button variant="primary" :href="route('dashboard')" icon="arrow-left">Back to dashboard</x-ui.button>
    </div>
@endsection
