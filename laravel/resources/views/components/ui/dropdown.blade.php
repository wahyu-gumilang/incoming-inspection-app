@props([
    'label',
    'value' => null,
    'options' => [],
    'open' => false,
    'toggle' => null,
    'select' => null,
    'tones' => [],
    'placement' => 'down',
    'disabled' => false,
    'id' => null,
    'links' => null,
])

@php($linkMode = is_array($links))

@if ($linkMode)
    <details {{ $attributes->merge(['class' => 'ui-dropdown ui-dropdown-links '.($placement === 'up' ? 'is-up' : '')]) }}>
        <summary class="ui-dropdown-trigger" @if ($id) id="{{ $id }}" @endif>
            <span>{{ $label }}</span>
            <x-icon name="chevron-down" :size="16" class="ui-dropdown-chevron" />
        </summary>

        <div class="ui-dropdown-panel" role="listbox">
            @foreach ($options as $optionValue => $optionLabel)
                @php($selected = (string) $value === (string) $optionValue)

                <a
                    class="ui-dropdown-option tone-{{ $tones[$optionValue] ?? 'neutral' }} {{ $selected ? 'is-selected' : '' }}"
                    href="{{ $links[$optionValue] }}"
                    role="option"
                    aria-selected="{{ $selected ? 'true' : 'false' }}"
                >
                    <span>{{ $optionLabel }}</span>
                    @if ($selected)
                        <x-icon name="check" :size="15" />
                    @endif
                </a>
            @endforeach
        </div>
    </details>
@else
    <div {{ $attributes->merge(['class' => 'ui-dropdown '.($open ? 'is-open' : '').' '.($placement === 'up' ? 'is-up' : '').' '.($disabled ? 'is-disabled' : '')]) }} @if ($open && ! $disabled) wire:keydown.escape.window="{{ $toggle }}" @endif>
        @if ($open && ! $disabled)
            <div class="ui-dropdown-backdrop" wire:click="{{ $toggle }}"></div>
        @endif

        <button
            class="ui-dropdown-trigger"
            type="button"
            @if ($id) id="{{ $id }}" @endif
            wire:click="{{ $toggle }}"
            aria-haspopup="listbox"
            aria-expanded="{{ $open && ! $disabled ? 'true' : 'false' }}"
            @disabled($disabled)
        >
            <span>{{ $label }}</span>
            <x-icon name="chevron-down" :size="16" class="ui-dropdown-chevron" />
        </button>

        @if ($open && ! $disabled)
            <div class="ui-dropdown-panel" role="listbox">
                @foreach ($options as $optionValue => $optionLabel)
                    @php($selected = (string) $value === (string) $optionValue)

                    <button
                        class="ui-dropdown-option tone-{{ $tones[$optionValue] ?? 'neutral' }} {{ $selected ? 'is-selected' : '' }}"
                        type="button"
                        wire:click="{{ $select }}('{{ $optionValue }}')"
                        role="option"
                        aria-selected="{{ $selected ? 'true' : 'false' }}"
                    >
                        <span>{{ $optionLabel }}</span>
                        @if ($selected)
                            <x-icon name="check" :size="15" />
                        @endif
                    </button>
                @endforeach
            </div>
        @endif
    </div>
@endif
