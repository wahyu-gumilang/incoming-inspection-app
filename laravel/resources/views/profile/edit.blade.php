@extends('layouts.app')

@section('title', 'Profile')

@section('content')
    @php($user = auth()->user())

    <div class="page-header">
        <div>
            <h1>Profile settings</h1>
            <p>Update your name, email address and theme preference.</p>
        </div>
    </div>

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
        <form method="POST" action="{{ route('profile.update') }}" class="form">
            @csrf
            @method('PUT')

            <label class="field">
                <span class="label">Username</span>
                <input class="input" type="text" value="{{ $user->username }}" disabled>
            </label>

            <label class="field">
                <span class="label">Role</span>
                <input class="input" type="text" value="{{ $user->roleLabel() }}" disabled>
            </label>

            <label class="field">
                <span class="label">Full name</span>
                <input
                    class="input"
                    type="text"
                    name="fullname"
                    value="{{ old('fullname', $user->fullname) }}"
                    maxlength="50"
                    required
                >
            </label>

            <label class="field">
                <span class="label">Email</span>
                <input
                    class="input"
                    type="email"
                    name="email"
                    value="{{ old('email', $user->email) }}"
                    maxlength="100"
                    placeholder="Optional"
                >
            </label>

            <label class="field">
                <span class="label">Theme</span>
                <select class="select" name="theme" required>
                    <option value="light" @selected(old('theme', $user->theme) === 'light')>Light</option>
                    <option value="dark" @selected(old('theme', $user->theme) === 'dark')>Dark</option>
                    <option value="system" @selected(old('theme', $user->theme) === 'system')>System</option>
                </select>
            </label>

            <div class="form-actions">
                <button class="btn btn-primary" type="submit">Save changes</button>
                <a class="btn" href="{{ route('password.change') }}">Change password</a>
            </div>
        </form>
    </div>
@endsection
