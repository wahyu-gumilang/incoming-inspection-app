@props(['paginator'])

@if ($paginator->hasPages())
    <nav class="pagination" aria-label="Pagination">
        <button
            class="page-btn"
            type="button"
            wire:click="previousPage"
            @disabled($paginator->onFirstPage())
        >
            <x-icon name="chevron-left" :size="14" />
            Previous
        </button>

        @foreach ($paginator->getUrlRange(max(1, $paginator->currentPage() - 1), min($paginator->lastPage(), $paginator->currentPage() + 1)) as $page => $url)
            <button
                class="page-btn {{ $page === $paginator->currentPage() ? 'is-active' : '' }}"
                type="button"
                wire:click="gotoPage({{ $page }})"
            >
                {{ $page }}
            </button>
        @endforeach

        <button
            class="page-btn"
            type="button"
            wire:click="nextPage"
            @disabled(! $paginator->hasMorePages())
        >
            Next
            <x-icon name="chevron-right" :size="14" />
        </button>
    </nav>
@endif
