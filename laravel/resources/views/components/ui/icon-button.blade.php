@props(['icon', 'label', 'variant' => 'neutral', 'type' => 'button'])

@php
    $variantClass = match ($variant) {
        'danger' => 'icon-btn-danger',
        'success' => 'icon-btn-success',
        default => '',
    };
@endphp

<button {{ $attributes->merge(['type' => $type, 'class' => "icon-btn {$variantClass}", 'title' => $label, 'aria-label' => $label]) }}>
    <x-icon :name="$icon" :size="16" />
</button>
