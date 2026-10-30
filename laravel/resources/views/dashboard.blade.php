@extends('layouts.app')

@section('title', 'Dashboard')

@section('content')
    <x-ui.page-header
        title="Dashboard"
        :description="'Welcome back, '.auth()->user()->fullname.'.'"
    >
        <x-slot:actions>
            <x-ui.button variant="primary" :href="route('items.index')" icon-after="arrow-right">Browse items</x-ui.button>
        </x-slot:actions>
    </x-ui.page-header>

    <div class="stat-grid">
        <div class="card stat">
            <span class="stat-label">Items</span>
            <strong>{{ number_format($itemCount) }}</strong>
            <span class="stat-note">Master items in csi_db</span>
        </div>
        <div class="card stat">
            <span class="stat-label">Standards</span>
            <strong>{{ number_format($standardCount) }}</strong>
            <span class="stat-note">Inspection standards</span>
        </div>
        <div class="card stat">
            <span class="stat-label">Inspections</span>
            <strong>{{ number_format($inspectionCount) }}</strong>
            <span class="stat-note">Saved inspection forms</span>
        </div>
        <div class="card stat">
            <span class="stat-label">Active users</span>
            <strong>{{ number_format($userCount) }}</strong>
            <span class="stat-note">Inspectors, checkers and admins</span>
        </div>
    </div>

    <div class="card">
        <h2>Current phase</h2>
        <p>
            The new application shell and navigation are in place. Master data, AQL
            administration, inspections and PDF reporting are the next milestones.
        </p>
    </div>
@endsection
