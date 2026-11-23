@props(['title', 'close', 'subtitle' => null])

@teleport('body')
    <div
        class="modal-backdrop"
        wire:click.self="{{ $close }}"
        wire:keydown.escape.window="{{ $close }}"
    >
        <div class="modal-card" role="dialog" aria-modal="true" aria-label="{{ $title }}">
            <div class="modal-head">
                <div>
                    <h2>{{ $title }}</h2>
                    @if ($subtitle)
                        <p>{{ $subtitle }}</p>
                    @endif
                </div>
                <button type="button" class="icon-btn" wire:click="{{ $close }}" data-tooltip="Close dialog" aria-label="Close dialog">
                    <x-icon name="x" :size="18" />
                </button>
            </div>

            <div class="modal-body">
                {{ $slot }}
            </div>
        </div>
    </div>
@endteleport
