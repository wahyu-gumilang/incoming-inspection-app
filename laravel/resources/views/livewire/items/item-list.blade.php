<div class="items-page">
    <x-ui.page-header
        eyebrow="Master Data"
        title="Items & Standards"
        description="Browse the item master and the inspection standards attached to each part."
    >
        <x-slot:actions>
            @if ($canManage)
                <x-ui.button variant="primary" icon="plus" wire:click="openCreate">Add item</x-ui.button>
            @else
                <x-ui.badge variant="neutral">View only</x-ui.badge>
            @endif
        </x-slot:actions>
    </x-ui.page-header>

    <div class="ui-stat-grid">
        <x-ui.stat
            tone="orange"
            icon="package"
            label="Total items"
            :value="number_format($stats['total'])"
            note="Part numbers in master data"
            class="is-interactive {{ $standards === 'all' ? 'is-active' : '' }}"
            role="button"
            tabindex="0"
            wire:click="selectStandards('all')"
            wire:keydown.enter="selectStandards('all')"
            wire:keydown.space.prevent="selectStandards('all')"
            aria-pressed="{{ $standards === 'all' ? 'true' : 'false' }}"
        />

        <x-ui.stat
            tone="green"
            icon="check"
            label="With standards"
            :value="number_format($stats['with'])"
            note="Ready for inspection setup"
            class="is-interactive {{ $standards === 'with' ? 'is-active' : '' }}"
            role="button"
            tabindex="0"
            wire:click="selectStandards('with')"
            wire:keydown.enter="selectStandards('with')"
            wire:keydown.space.prevent="selectStandards('with')"
            aria-pressed="{{ $standards === 'with' ? 'true' : 'false' }}"
        />

        <x-ui.stat
            tone="red"
            icon="x"
            label="Without standards"
            :value="number_format($stats['without'])"
            note="Need standards before use"
            class="is-interactive {{ $standards === 'without' ? 'is-active' : '' }}"
            role="button"
            tabindex="0"
            wire:click="selectStandards('without')"
            wire:keydown.enter="selectStandards('without')"
            wire:keydown.space.prevent="selectStandards('without')"
            aria-pressed="{{ $standards === 'without' ? 'true' : 'false' }}"
        />
    </div>

    <div class="card items-panel">
        <div class="items-toolbar">
            <x-ui.search
                wire:model.live.debounce.300ms="search"
                placeholder="Search part number or name..."
                label="Search items"
            />

            <div class="items-toolbar-filter">
                <x-ui.dropdown
                    :label="$standardsOptions[$standards] ?? 'All standards'"
                    :value="$standards"
                    :options="$standardsOptions"
                    :tones="$standardsTones"
                    :open="$openStandards"
                    toggle="toggleStandards"
                    select="selectStandards"
                />
            </div>
        </div>

        @if ($items->isEmpty())
            <div class="items-empty">
                <x-ui.empty-state
                    icon="package"
                    title="No items found"
                    description="Try another part number or name, or clear the standards filter."
                >
                    <x-slot:actions>
                        <x-ui.button variant="secondary" icon="rotate-ccw" wire:click="resetFilters">Clear filters</x-ui.button>
                    </x-slot:actions>
                </x-ui.empty-state>
            </div>
        @else
            <div class="items-table-wrap">
                <table class="items-table items-table-modern">
                    <thead>
                        <tr>
                            <th>Part number</th>
                            <th>Part name</th>
                            <th>Standards</th>
                            <th>Breakdown</th>
                            <th class="items-table-action">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($items as $item)
                            <tr wire:key="item-{{ $item->itemid }}">
                                <td>
                                    <a class="item-id-link mono" href="{{ route('items.show', $item->itemid) }}">
                                        {{ $item->itemid }}
                                    </a>
                                </td>
                                <td><span class="item-name">{{ $item->name }}</span></td>
                                <td><span class="item-standard-total">{{ number_format($item->standards_count) }}</span></td>
                                <td>
                                    <div class="item-type-breakdown">
                                        <span class="type-chip type-std {{ $item->std_count ? '' : 'is-empty' }}">STD {{ $item->std_count }}</span>
                                        <span class="type-chip type-certifikat {{ $item->certifikat_count ? '' : 'is-empty' }}">Cert {{ $item->certifikat_count }}</span>
                                        <span class="type-chip type-visual {{ $item->visual_count ? '' : 'is-empty' }}">Visual {{ $item->visual_count }}</span>
                                        <span class="type-chip type-fitting {{ $item->fitting_count ? '' : 'is-empty' }}">Fit {{ $item->fitting_count }}</span>
                                    </div>
                                </td>
                                <td class="items-table-action">
                                    <x-ui.button
                                        variant="ghost"
                                        size="sm"
                                        :href="route('items.show', $item->itemid)"
                                        icon-after="chevron-right"
                                    >
                                        View
                                    </x-ui.button>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>

            <div class="items-footer">
                <span class="items-count">
                    Showing {{ $items->firstItem() }}-{{ $items->lastItem() }} of
                    {{ number_format($items->total()) }} items
                </span>

                <x-ui.pagination :paginator="$items" />
            </div>
        @endif
    </div>

    @if ($showCreate)
        <x-ui.modal
            title="Add item"
            subtitle="Create a part number before attaching inspection standards."
            close="closeCreate"
        >
            <form wire:submit="createItem" class="form">
                <x-ui.field
                    label="Part number"
                    for="create-itemid"
                    name="itemid"
                    hint="Unique part number, up to 30 characters. This cannot be changed later."
                >
                    <input
                        id="create-itemid"
                        class="input mono"
                        type="text"
                        wire:model="itemid"
                        maxlength="30"
                        autofocus
                        autocomplete="off"
                    >
                </x-ui.field>

                <x-ui.field label="Part name" for="create-item-name" name="name">
                    <input
                        id="create-item-name"
                        class="input"
                        type="text"
                        wire:model="name"
                        maxlength="100"
                        autocomplete="off"
                    >
                </x-ui.field>

                <div class="modal-foot">
                    <x-ui.button variant="secondary" type="button" icon="x" wire:click="closeCreate">Cancel</x-ui.button>
                    <x-ui.button variant="primary" type="submit" icon="plus" wire:loading.attr="disabled">Create item</x-ui.button>
                </div>
            </form>
        </x-ui.modal>
    @endif
</div>
