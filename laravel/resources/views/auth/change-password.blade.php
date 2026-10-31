@extends('layouts.app')

@section('title', 'Change password')

@section('content')
    <div class="page-header">
        <div>
            <h1>Change password</h1>
            <p>Use at least 8 characters. The new password applies to your account immediately.</p>
        </div>
    </div>

    @if (auth()->user()->must_change_password)
        <div class="alert alert-info" role="status">
            Your account uses a temporary password. Set a new password to continue.
        </div>
    @endif

    @if ($errors->any())
        <div class="alert alert-error" role="alert">
            <ul>
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <div class="card card-narrow">
        <form method="POST" action="{{ route('password.update') }}" class="form">
            @csrf

            <label class="field">
                <span class="label">Current password</span>
                <input
                    class="input"
                    type="password"
                    name="current_password"
                    autocomplete="current-password"
                    required
                >
            </label>

            <label class="field">
                <span class="label">New password</span>
                <input
                    class="input"
                    type="password"
                    name="password"
                    autocomplete="new-password"
                    minlength="8"
                    maxlength="72"
                    required
                >
            </label>

            <label class="field">
                <span class="label">Confirm new password</span>
                <input
                    class="input"
                    type="password"
                    name="password_confirmation"
                    autocomplete="new-password"
                    minlength="8"
                    maxlength="72"
                    required
                >
            </label>

            <div class="form-actions">
                <button class="btn btn-primary" type="submit">Update password</button>
            </div>
        </form>
    </div>
@endsection
