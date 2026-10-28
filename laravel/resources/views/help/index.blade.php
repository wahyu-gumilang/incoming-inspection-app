@extends('layouts.app')

@section('title', 'Help Center')

@section('content')
    <div class="page-header">
        <div>
            <span class="page-eyebrow">Support</span>
            <h1>Help Center</h1>
            <p>Quick guidance for access and incoming inspection.</p>
        </div>
        <a class="btn" href="{{ route('dashboard') }}">Back to dashboard</a>
    </div>

    <div class="help-grid">
        <div class="card help-card">
            <span class="help-card-icon">
                <x-icon name="user" :size="24" />
            </span>
            <h2>Sign in and access</h2>
            <p>
                Use your PT. Chubb Safes Indonesia username. If your account is inactive or you
                need a password reset, contact an administrator.
            </p>
        </div>

        <div class="card help-card">
            <span class="help-card-icon">
                <x-icon name="clipboard-check" :size="24" />
            </span>
            <h2>Incoming inspection</h2>
            <p>
                Select the item and supplier, fill up to seven delivery columns, enter the actual
                values, and choose a judgment. AQL values follow the received quantity and
                inspection category.
            </p>
        </div>

        <div class="card help-card">
            <span class="help-card-icon">
                <x-icon name="help-circle" :size="24" />
            </span>
            <h2>Need more help?</h2>
            <p>
                Contact the Quality system administrator or IT. Include the inspection number and
                a screenshot of the issue so the team can trace it quickly.
            </p>
        </div>
    </div>
@endsection
