@props([
    'label',
    'value',
    'note' => null,
    'icon' => 'package',
    'tone' => 'blue',
])

<div {{ $attributes->merge(['class' => "card ui-stat ui-stat-{$tone}"]) }}>
    <span class="ui-stat-icon">
        <x-icon :name="$icon" :size="22" />
    </span>
    <span class="ui-stat-copy">
        <span class="ui-stat-label">{{ $label }}</span>
        <strong>{{ $value }}</strong>
        @if ($note)
            <small>{{ $note }}</small>
        @endif
    </span>
</div>
