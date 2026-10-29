@props([
    'title',
    'close',
    'confirm',
    'confirmLabel' => 'Confirm',
    'variant' => 'primary',
])

<x-ui.modal :title="$title" :close="$close">
    <div class="ui-confirm-body">
        {{ $slot }}
    </div>

    <div class="modal-foot">
        <x-ui.button variant="secondary" wire:click="{{ $close }}">Cancel</x-ui-button>
        <x-ui.button
            :variant="$variant"
            wire:click="{{ $confirm }}"
            wire:loading.attr="disabled"
        >
            {{ $confirmLabel }}
        </x-ui.button>
    </div>
</x-ui.modal>
