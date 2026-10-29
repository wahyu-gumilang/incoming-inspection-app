@props(['variant' => 'neutral', 'size' => 'md'])

<span {{ $attributes->merge(['class' => trim("badge badge-{$variant} ".($size === 'sm' ? 'badge-sm' : ''))]) }}>{{ $slot }}</span>
