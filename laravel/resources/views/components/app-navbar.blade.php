@php
    $user = auth()->user();
    $now = now('Asia/Jakarta');

    $search = request('search');
    $search = is_string($search) ? $search : '';

    $items = [
        ['label' => 'Dashboard', 'route' => 'dashboard', 'icon' => 'dashboard', 'active' => request()->routeIs('dashboard')],
        ['label' => 'Items', 'route' => 'items.index', 'icon' => 'package', 'active' => request()->routeIs('items.*')],
        ['label' => 'Inspection Form', 'route' => 'inspections.index', 'icon' => 'clipboard-check', 'active' => request()->routeIs('inspections.*')],
        ['label' => 'AQL Table', 'route' => 'aql.index', 'icon' => 'table', 'active' => request()->routeIs('aql.*')],
        ['label' => 'Vendor', 'route' => 'vendors.index', 'icon' => 'building', 'active' => request()->routeIs('vendors.*')],
        ['label' => 'Reports', 'route' => 'reports.index', 'icon' => 'reports', 'active' => request()->routeIs('reports.*')],
    ];

    if ($user->isAdmin()) {
        $items[] = ['label' => 'User Management', 'route' => 'users.index', 'icon' => 'users', 'active' => request()->routeIs('users.*')];
    }
@endphp

<div class="app-navbar" data-navbar>
    <div class="app-navbar-top">
        <a class="app-navbar-brand" href="{{ route('dashboard') }}" aria-label="Incoming Inspection QC dashboard">
            <img class="app-navbar-logo app-navbar-logo-light" src="{{ asset('brand/logo.png') }}" alt="Chubbsafes">
            <img class="app-navbar-logo app-navbar-logo-dark" src="{{ asset('brand/chubbsafes-white.png') }}" alt="Chubbsafes">
        </a>

        <form class="app-navbar-search" role="search" action="{{ route('items.index') }}" method="GET">
            <x-icon name="search" :size="18" class="app-navbar-search-icon" />
            <input
                type="search"
                name="search"
                value="{{ $search }}"
                placeholder="Search items, part numbers..."
                aria-label="Search items"
                autocomplete="off"
                data-navbar-search
            >
            <kbd class="app-navbar-kbd" aria-hidden="true">Ctrl K</kbd>
        </form>

        <div class="app-navbar-actions">
            <div
                class="app-navbar-weather is-loading"
                data-weather-badge
                data-weather-lat="-6.2088"
                data-weather-lon="106.8456"
                data-weather-label="Jakarta"
                role="status"
                aria-live="polite"
                aria-label="Current weather in Jakarta"
            >
                <span class="app-navbar-weather-icon" aria-hidden="true">
                    <x-icon name="sun" :size="18" data-weather-icon="sun" hidden />
                    <x-icon name="moon" :size="18" data-weather-icon="moon" hidden />
                    <x-icon name="cloud-sun" :size="18" data-weather-icon="cloud-sun" />
                    <x-icon name="cloud" :size="18" data-weather-icon="cloud" hidden />
                    <x-icon name="cloud-rain" :size="18" data-weather-icon="cloud-rain" hidden />
                    <x-icon name="cloud-snow" :size="18" data-weather-icon="cloud-snow" hidden />
                    <x-icon name="cloud-lightning" :size="18" data-weather-icon="cloud-lightning" hidden />
                    <x-icon name="cloud-fog" :size="18" data-weather-icon="cloud-fog" hidden />
                </span>
                <span class="app-navbar-weather-temp" data-weather-temp>--&deg;C</span>
            </div>

            <time class="app-navbar-date" datetime="{{ $now->toIso8601String() }}">
                <strong>{{ $now->format('l') }}</strong>
                <span>{{ $now->format('jS M Y') }}</span>
            </time>

            <div class="app-navbar-user" data-user-menu>
                <button
                    class="app-navbar-avatar"
                    type="button"
                    aria-expanded="false"
                    aria-controls="app-user-menu"
                    aria-label="Open user menu for {{ $user->fullname }}"
                    data-user-menu-button
                >
                    <x-user-avatar :user="$user" :size="30" />
                    <x-icon name="chevron-down" :size="14" class="app-navbar-avatar-chevron" />
                </button>

                <div class="app-navbar-menu" id="app-user-menu" hidden data-user-menu-panel>
                    <div class="app-navbar-menu-profile">
                        <x-user-avatar :user="$user" :size="36" />
                        <div class="app-navbar-menu-profile-text">
                            <strong>{{ $user->fullname }}</strong>
                            <span>{{ $user->roleLabel() }}</span>
                        </div>
                    </div>

                    <div class="app-navbar-menu-divider"></div>

                    <div class="app-navbar-menu-section" role="group" aria-labelledby="account-option-title">
                        <span class="app-navbar-menu-heading" id="account-option-title">Account Option</span>

                        <a class="app-navbar-menu-item" href="{{ route('profile.edit') }}">
                            <x-icon name="user" :size="17" />
                            User Setting
                        </a>

                        <a class="app-navbar-menu-item" href="{{ route('help.index') }}">
                            <x-icon name="help-circle" :size="17" />
                            Help Center
                        </a>

                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button class="app-navbar-menu-item app-navbar-menu-item-danger" type="submit">
                                <x-icon name="logout" :size="17" />
                                Sign out
                            </button>
                        </form>
                    </div>

                    <div class="app-navbar-menu-divider"></div>

                    <form
                        class="app-navbar-theme"
                        method="POST"
                        action="{{ route('profile.theme') }}"
                        data-theme-control
                        data-theme-preference="{{ $user->theme }}"
                    >
                        @csrf
                        @method('PATCH')

                        <div class="app-navbar-theme-options" role="group" aria-label="Theme">
                            <button
                                type="submit"
                                name="theme"
                                value="light"
                                class="app-navbar-theme-option {{ $user->theme === 'light' ? 'is-active' : '' }}"
                                data-theme-choice="light"
                                aria-pressed="{{ $user->theme === 'light' ? 'true' : 'false' }}"
                            >
                                <x-icon name="sun" :size="16" />
                                <span>Light</span>
                            </button>

                            <button
                                type="submit"
                                name="theme"
                                value="dark"
                                class="app-navbar-theme-option {{ $user->theme === 'dark' ? 'is-active' : '' }}"
                                data-theme-choice="dark"
                                aria-pressed="{{ $user->theme === 'dark' ? 'true' : 'false' }}"
                            >
                                <x-icon name="moon" :size="16" />
                                <span>Dark</span>
                            </button>

                            <button
                                type="submit"
                                name="theme"
                                value="system"
                                class="app-navbar-theme-option {{ $user->theme === 'system' ? 'is-active' : '' }}"
                                data-theme-choice="system"
                                aria-pressed="{{ $user->theme === 'system' ? 'true' : 'false' }}"
                            >
                                <x-icon name="monitor" :size="16" />
                                <span>System</span>
                            </button>
                        </div>

                        <p class="app-navbar-theme-status" data-theme-status role="status" aria-live="polite"></p>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <div class="app-navbar-bottom">
        <nav class="app-navbar-nav" aria-label="Main navigation">
            @foreach ($items as $item)
                <a
                    href="{{ route($item['route']) }}"
                    class="app-navbar-link {{ $item['active'] ? 'is-active' : '' }}"
                    @if ($item['active']) aria-current="page" @endif
                >
                    <x-icon :name="$item['icon']" :size="17" />
                    <span>{{ $item['label'] }}</span>
                </a>
            @endforeach
        </nav>
    </div>
</div>
