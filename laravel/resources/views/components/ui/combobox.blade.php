@props([
    'options' => [],
    'value' => null,
    'placeholder' => 'Select an option...',
    'open' => false,
    'toggle',
    'select',
    'selectKey' => null,
    'searchable' => false,
    'disabled' => false,
    'id' => null,
    'icon' => null,
    'ariaLabel' => null,
    'size' => 'md',
    'floating' => false,
    'tone' => null,
])

@php
    $selected = null;

    foreach ($options as $option) {
        if ((string) ($option['value'] ?? '') === (string) $value) {
            $selected = $option;
            break;
        }
    }
@endphp

<div
    {{ $attributes->merge(['class' => 'ui-combobox '.($size === 'sm' ? 'ui-combobox-sm' : '').' '.($floating ? 'ui-combobox-floating' : '').' '.($tone ? 'is-tone-'.$tone : '').' '.($open ? 'is-open' : '').' '.($disabled ? 'is-disabled' : '')]) }}
    x-data="{ query: '', panelStyle: '' }"
    @if ($open && ! $disabled) wire:keydown.escape.window="{{ $toggle }}" @endif
>
    @if ($open && ! $disabled)
        <div class="ui-dropdown-backdrop" wire:click="{{ $toggle }}"></div>
    @endif

    <button
        class="ui-combobox-trigger"
        type="button"
        x-ref="trigger"
        @if ($id) id="{{ $id }}" @endif
        @if ($ariaLabel) aria-label="{{ $ariaLabel }}" @endif
        wire:click="{{ $toggle }}"
        aria-haspopup="listbox"
        aria-expanded="{{ $open && ! $disabled ? 'true' : 'false' }}"
        @if ($id) aria-controls="{{ $id }}-panel" @endif
        @disabled($disabled)
    >
        @if ($icon)
            <span class="ui-combobox-leading">
                <x-icon :name="$icon" :size="16" />
            </span>
        @endif

        <span class="ui-combobox-selection">
            @if ($selected)
                <span class="ui-combobox-value">{{ $selected['label'] ?? '' }}</span>

                @if (($selected['code'] ?? null) || ($selected['meta'] ?? null))
                    <span class="ui-combobox-meta">
                        @if ($selected['code'] ?? null)
                            <span class="ui-combobox-code">{{ $selected['code'] }}</span>
                        @endif

                        @if (($selected['code'] ?? null) && ($selected['meta'] ?? null))
                            <span aria-hidden="true">·</span>
                        @endif

                        @if ($selected['meta'] ?? null)
                            <span>{{ $selected['meta'] }}</span>
                        @endif
                    </span>
                @endif
            @else
                <span class="ui-combobox-value is-placeholder">{{ $placeholder }}</span>
            @endif
        </span>

        @if ($selected && ($selected['tag'] ?? null))
            <span class="ui-combobox-trigger-tag">{{ $selected['tag'] }}</span>
        @endif

        <x-icon name="chevron-down" :size="$size === 'sm' ? 14 : 16" class="ui-combobox-chevron" />
    </button>

    @if ($open && ! $disabled)
        <div
            class="ui-dropdown-panel ui-combobox-panel {{ $floating ? 'ui-combobox-floating-panel' : '' }}"
            @if ($id) id="{{ $id }}-panel" @endif
            @if ($floating)
                x-bind:style="panelStyle"
                x-init="
                    const rect = $refs.trigger.getBoundingClientRect();
                    const width = Math.min(Math.max(rect.width, 180), window.innerWidth - 16);
                    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
                    const openUp = window.innerHeight - rect.bottom < 220 && rect.top > window.innerHeight - rect.bottom;
                    panelStyle = openUp
                        ? `bottom: ${window.innerHeight - rect.top + 6}px; top: auto; left: ${left}px; width: ${width}px`
                        : `top: ${rect.bottom + 6}px; left: ${left}px; width: ${width}px`;
                "
            @endif
            role="listbox"
        >
            @if ($searchable)
                <div class="ui-combobox-search" x-init="query = ''">
                    <x-icon name="search" :size="15" />

                    <input
                        type="search"
                        x-model="query"
                        x-ref="search"
                        x-init="$nextTick(() => $refs.search?.focus())"
                        wire:keydown.enter.prevent
                        placeholder="Search..."
                        aria-label="Search options"
                        autocomplete="off"
                    >
                </div>
            @endif

            <div class="ui-combobox-list">
                @forelse ($options as $option)
                    @php
                        $optionValue = (string) ($option['value'] ?? '');
                        $isSelected = $selected !== null && (string) ($selected['value'] ?? '') === $optionValue;
                        $searchText = mb_strtolower(trim(($option['code'] ?? '').' '.($option['label'] ?? '').' '.($option['meta'] ?? '')));
                    @endphp

                    <button
                        class="ui-combobox-option {{ $isSelected ? 'is-selected' : '' }}"
                        type="button"
                        role="option"
                        data-value="{{ $optionValue }}"
                        data-search="{{ $searchText }}"
                        wire:click="{{ $select }}($event.currentTarget.dataset.value{{ $selectKey !== null ? ', '.$selectKey : '' }})"
                        aria-selected="{{ $isSelected ? 'true' : 'false' }}"
                        @if ($searchable) x-show="query === '' || $el.dataset.search.includes(query.toLowerCase())" @endif
                    >
                        @if ($option['code'] ?? null)
                            <span class="ui-combobox-option-code">{{ $option['code'] }}</span>
                            <span class="ui-combobox-option-divider" aria-hidden="true"></span>
                        @endif

                        <span class="ui-combobox-option-body">
                            <span class="ui-combobox-option-label">{{ $option['label'] ?? '' }}</span>

                            @if ($option['meta'] ?? null)
                                <span class="ui-combobox-option-meta">{{ $option['meta'] }}</span>
                            @endif
                        </span>

                        @if ($option['tag'] ?? null)
                            <span class="ui-combobox-tag">{{ $option['tag'] }}</span>
                        @endif

                        @if ($isSelected)
                            <x-icon name="check" :size="15" class="ui-combobox-check" />
                        @endif
                    </button>
                @empty
                    <p class="ui-combobox-empty">No options available.</p>
                @endforelse
            </div>
        </div>
    @endif
</div>
