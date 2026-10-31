<div class="items-panel">
    <div class="items-toolbar">
        <div>
            <h1>Items and standards</h1>
            <p>Search the item master and inspect its standards.</p>
        </div>
        <input
            type="search"
            wire:model.live.debounce.300ms="search"
            placeholder="Search part number or name"
            aria-label="Search items"
        >
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th>Part number</th>
                <th>Part name</th>
                <th>Standards</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($items as $item)
                <tr>
                    <td class="mono">{{ $item->itemid }}</td>
                    <td>{{ $item->name }}</td>
                    <td>{{ number_format($item->standards_count) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="3" class="empty">No items match "{{ $search }}".</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <p class="items-note">
        Showing {{ $items->count() }} of {{ number_format($total) }} items. The search uses a
        Livewire server round trip.
    </p>
</div>
