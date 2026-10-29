@props(['eyebrow' => null, 'title', 'description' => null])

<div {{ $attributes->merge(['class' => 'page-header']) }}>
    <div>
        @if ($eyebrow)
            <span class="page-eyebrow">{{ $eyebrow }}</span>
        @endif
        <h1>{{ $title }}</h1>
        @if ($description)
            <p>{{ $description }}</p>
        @endif
    </div>

    @isset($actions)
        <div class="page-header-actions">{{ $actions }}</div>
    @endisset
</div>
