@props(['label', 'for', 'name' => null, 'hint' => null])

@php($errorKey = $name ?? $for)

<div {{ $attributes->merge(['class' => 'field']) }}>
    <label class="label" for="{{ $for }}">{{ $label }}</label>

    {{ $slot }}

    @if ($hint)
        <span class="field-hint">{{ $hint }}</span>
    @endif

    @error($errorKey)
        <span class="field-error">{{ $message }}</span>
    @enderror
</div>
