@props([
    'size' => 'md',
    'icon' => null,
    'tone' => null,
])

<div class="ui-select {{ $size === 'sm' ? 'ui-select-sm' : '' }} {{ $tone ? 'is-tone-'.$tone : '' }}">
    @if ($icon)
        <span class="ui-select-leading">
            <x-icon :name="$icon" :size="$size === 'sm' ? 14 : 16" />
        </span>
    @endif

    <select {{ $attributes->merge(['class' => 'ui-select-native']) }}>
        {{ $slot }}
    </select>

    <x-icon name="chevron-down" :size="$size === 'sm' ? 14 : 16" class="ui-select-chevron" />
</div>
