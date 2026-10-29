@props(['variant' => 'info'])

@php
    $role = in_array($variant, ['error', 'warning'], true) ? 'alert' : 'status';
@endphp

<div {{ $attributes->merge(['class' => "alert alert-{$variant}", 'role' => $role]) }}>
    {{ $slot }}
</div>
