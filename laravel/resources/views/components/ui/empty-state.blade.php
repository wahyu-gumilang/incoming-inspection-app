@props(['icon' => 'search', 'title', 'description' => null])

<div {{ $attributes->merge(['class' => 'ui-empty-state']) }}>
    <span class="ui-empty-state-icon">
        <x-icon :name="$icon" :size="26" />
    </span>
    <h2>{{ $title }}</h2>
    @if ($description)
        <p>{{ $description }}</p>
    @endif
    @isset($actions)
        <div class="ui-empty-state-actions">{{ $actions }}</div>
    @endisset
</div>
