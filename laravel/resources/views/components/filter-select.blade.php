@props([
    'label',
    'value',
    'options',
    'open' => false,
    'toggle',
    'select',
    'tones' => [],
    'placement' => 'down',
    'disabled' => false,
])

<div class="filter-select {{ $open ? 'is-open' : '' }} {{ $placement === 'up' ? 'is-up' : '' }} {{ $disabled ? 'is-disabled' : '' }}" @if ($open && ! $disabled) wire:keydown.escape.window="{{ $toggle }}" @endif>
    @if ($open && ! $disabled)
        <div class="filter-select-backdrop" wire:click="{{ $toggle }}"></div>
    @endif

    <button
        class="filter-select-trigger"
        type="button"
        wire:click="{{ $toggle }}"
        aria-haspopup="listbox"
        aria-expanded="{{ $open && ! $disabled ? 'true' : 'false' }}"
        @disabled($disabled)
    >
        <span>{{ $label }}</span>
        <x-icon name="chevron-down" :size="16" class="filter-select-chevron" />
    </button>

    @if ($open && ! $disabled)
        <div class="filter-select-panel" role="listbox">
            @foreach ($options as $optionValue => $optionLabel)
                @php($selected = (string) $value === (string) $optionValue)

                <button
                    class="filter-select-option tone-{{ $tones[$optionValue] ?? 'neutral' }} {{ $selected ? 'is-selected' : '' }}"
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
