@props(['user', 'size' => 30])

@php
    $nameParts = preg_split('/\s+/', trim((string) $user->fullname)) ?: [];
    $initials = collect($nameParts)
        ->filter()
        ->take(2)
        ->map(fn (string $part): string => mb_strtoupper(mb_substr($part, 0, 1)))
        ->implode('');
    $initials = $initials !== '' ? $initials : mb_strtoupper(mb_substr((string) $user->username, 0, 1));

    $hasAvatar = $user->avatar_path
        && \Illuminate\Support\Facades\Storage::disk('public')->exists($user->avatar_path);
    $avatarUrl = $hasAvatar
        ? route('avatars.show', ['filename' => basename($user->avatar_path)])
        : null;
@endphp

<span
    {{ $attributes->merge(['class' => 'user-avatar']) }}
    style="--avatar-size: {{ $size }}px"
    aria-hidden="true"
>
    @if ($avatarUrl)
        <img src="{{ $avatarUrl }}" alt="">
    @else
        {{ $initials }}
    @endif
</span>
