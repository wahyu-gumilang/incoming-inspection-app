@props(['active' => 'profile'])

<nav class="settings-tabs" aria-label="Account settings">
    <a
        class="settings-tab {{ $active === 'profile' ? 'is-active' : '' }}"
        href="{{ route('profile.edit') }}"
        @if ($active === 'profile') aria-current="page" @endif
    >
        <x-icon name="user" :size="16" />
        Profile
    </a>

    <a
        class="settings-tab {{ $active === 'password' ? 'is-active' : '' }}"
        href="{{ route('password.change') }}"
        @if ($active === 'password') aria-current="page" @endif
    >
        <x-icon name="key" :size="16" />
        Password
    </a>
</nav>
