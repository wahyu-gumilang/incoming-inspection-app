<!DOCTYPE html>
<html lang="en" data-theme="{{ auth()->user()->theme === 'system' ? 'light' : auth()->user()->theme }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Incoming Inspection QC') - Incoming Inspection QC</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
    @livewireStyles
    <script>
        (() => {
            const preference = @json(auth()->user()->theme);
            const media = window.matchMedia('(prefers-color-scheme: dark)');

            const apply = () => {
                const dark = preference === 'dark' || (preference === 'system' && media.matches);
                document.documentElement.dataset.theme = dark ? 'dark' : 'light';
            };

            apply();
            media.addEventListener('change', () => {
                if (preference === 'system') apply();
            });
        })();
    </script>
</head>
<body>
    <header class="topbar">
        <a class="brand" href="{{ route('dashboard') }}">
            <img class="logo-light" src="{{ asset('brand/logo.png') }}" alt="Chubbsafes">
            <img class="logo-dark" src="{{ asset('brand/logo-white.png') }}" alt="Chubbsafes">
            <span>
                <strong>Incoming Inspection QC</strong>
                <small>PT. Chubb Safes Indonesia</small>
            </span>
        </a>

        <nav class="nav" aria-label="Main navigation">
            <a href="{{ route('dashboard') }}" class="{{ request()->routeIs('dashboard') ? 'active' : '' }}">Dashboard</a>
            <a href="{{ route('items.index') }}" class="{{ request()->routeIs('items.*') ? 'active' : '' }}">Items</a>
            <a href="{{ route('profile.edit') }}" class="{{ request()->routeIs('profile.*') ? 'active' : '' }}">Profile</a>
        </nav>

        <div class="user-box">
            <span class="user-name">{{ auth()->user()->fullname }}</span>
            <span class="role">{{ auth()->user()->roleLabel() }}</span>
            <form method="POST" action="{{ route('logout') }}">
                @csrf
                <button class="btn" type="submit">Sign out</button>
            </form>
        </div>
    </header>

    <main class="page">
        @if (session('status'))
            <div class="alert alert-success" role="status">{{ session('status') }}</div>
        @endif

        @yield('content')
    </main>

    @livewireScripts
</body>
</html>
