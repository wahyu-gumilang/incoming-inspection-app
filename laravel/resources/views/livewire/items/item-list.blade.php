<div class="poc-card">
    <div class="poc-toolbar">
        <div>
            <h1>Items &amp; standards</h1>
            <p>Proof of concept: Laravel 13 + Livewire 4 reading the real <code>csi_db</code>.</p>
        </div>
        <input
            type="search"
            wire:model.live.debounce.300ms="search"
            placeholder="Search part no. or name"
            aria-label="Search items"
        />
    </div>

    <table>
        <thead>
            <tr>
                <th>Part No.</th>
                <th>Part Name</th>
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

    <p class="poc-note">
        Showing {{ $items->count() }} of {{ number_format($total) }} items. The search uses a
        Livewire server round trip.
    </p>
</div>
