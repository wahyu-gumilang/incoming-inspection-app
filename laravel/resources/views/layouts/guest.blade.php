<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Sign in') - Incoming Inspection QC</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
</head>
<body class="auth-body">
    <div class="auth-background" aria-hidden="true"></div>

    <header class="auth-topbar">
        <img src="{{ asset('brand/chubbsafes-white.png') }}" alt="Chubbsafes">
        <span>Incoming Inspection QC</span>
    </header>

    <main class="auth-stage">
        <section class="auth-card" aria-labelledby="login-title">
            @yield('content')
        </section>

        <footer class="auth-page-footer">
            &copy; 2026 PT. Chubb Safes Indonesia. All rights reserved.
        </footer>
    </main>

    @stack('scripts')
</body>
</html>
