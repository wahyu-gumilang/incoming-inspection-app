@extends('layouts.app')

@section('title', $title)

@section('content')
    <div class="page-header">
        <div>
            <span class="page-eyebrow">Module</span>
            <h1>{{ $title }}</h1>
            <p>{{ $description }}</p>
        </div>
    </div>

    <div class="card module-placeholder">
        <span class="module-placeholder-icon">
            <x-icon :name="$icon" :size="30" />
        </span>
        <h2>Coming next</h2>
        <p>
            This module is wired into the new navigation. The page is ready for its feature work
            in the next phase of the PHP migration.
        </p>
        <a class="btn btn-primary" href="{{ route('dashboard') }}">Back to dashboard</a>
    </div>
@endsection
