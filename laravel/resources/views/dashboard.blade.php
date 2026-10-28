@extends('layouts.app')

@section('title', 'Dashboard')

@section('content')
    <div class="page-header">
        <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {{ auth()->user()->fullname }}.</p>
        </div>
        <a class="btn btn-primary" href="{{ route('items.index') }}">Browse items</a>
    </div>

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
