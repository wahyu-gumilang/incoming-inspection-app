<!DOCTYPE html>
<html lang="en" data-theme="{{ auth()->user()->theme === 'system' ? 'light' : auth()->user()->theme }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Incoming Inspection QC') - Incoming Inspection QC</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
    <link rel="stylesheet" href="{{ asset('css/navbar.css') }}">
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
        })();
    </script>
</head>
<body class="app-body">
    <div class="app-navbar-wrap">
        <x-app-navbar />
    </div>

    <main class="page">
        @if (session('status'))
            <div class="alert alert-success" role="status">{{ session('status') }}</div>
        @endif

        @yield('content')
    </main>

    <script src="{{ asset('js/navbar.js') }}" defer></script>
    @livewireScripts
</body>
</html>
