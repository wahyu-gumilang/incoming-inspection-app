<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Sign in') - Incoming Inspection QC</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
</head>
<body class="auth-body">
    <main class="auth-page">
        <section class="auth-brand">
            <img src="{{ asset('brand/logo-white.png') }}" alt="Chubbsafes">
            <h1>Incoming Inspection QC</h1>
            <p>PT. Chubb Safes Indonesia</p>
            <p class="auth-note">
                Record, evaluate and store incoming inspections against Form No. 7.4.3-F1.
            </p>
        </section>

        <section class="auth-card">
            <div class="auth-inner">
                @yield('content')
            </div>
        </section>
    </main>
</body>
</html>
