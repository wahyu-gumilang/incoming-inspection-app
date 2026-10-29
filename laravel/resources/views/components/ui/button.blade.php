@props([
    'variant' => 'secondary',
    'size' => 'md',
    'type' => 'button',
    'icon' => null,
    'block' => false,
    'href' => null,
])

@php
    $variantClass = match ($variant) {
        'primary' => 'btn-primary',
        'danger' => 'btn-danger',
        'success' => 'btn-success',
        'ghost' => 'btn-ghost',
        default => '',
    };
    $sizeClass = $size === 'sm' ? 'btn-sm' : '';
    $classes = trim("btn {$variantClass} {$sizeClass}".($block ? ' btn-block' : ''));
@endphp

@if ($href)
    <a {{ $attributes->merge(['href' => $href, 'class' => $classes]) }}>
        @if ($icon)
            <x-icon :name="$icon" :size="$size === 'sm' ? 15 : 17" />
        @endif
        {{ $slot }}
    </a>
@else
    <button {{ $attributes->merge(['type' => $type, 'class' => $classes]) }}>
        @if ($icon)
            <x-icon :name="$icon" :size="$size === 'sm' ? 15 : 17" />
        @endif
        {{ $slot }}
    </button>
@endif
