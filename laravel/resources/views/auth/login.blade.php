@extends('layouts.guest')

@section('title', 'Sign in')

@section('content')
    <h1 class="auth-title">Sign in</h1>
    <p class="auth-subtitle">Use your QC account to continue.</p>

    @if ($errors->any())
        <div class="alert alert-error" role="alert">
            <ul>
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <form method="POST" action="{{ route('login.store') }}" class="form">
        @csrf

        <label class="field">
            <span class="label">Username</span>
            <input
                class="input"
                type="text"
                name="username"
                value="{{ old('username') }}"
                autocomplete="username"
                autofocus
                required
                maxlength="50"
            >
        </label>

        <label class="field">
            <span class="label">Password</span>
            <input
                class="input"
                type="password"
                name="password"
                autocomplete="current-password"
                required
            >
        </label>

        <button class="btn btn-primary btn-block" type="submit">Sign in</button>
    </form>

    <p class="auth-foot">Accounts are created by an administrator.</p>
@endsection
