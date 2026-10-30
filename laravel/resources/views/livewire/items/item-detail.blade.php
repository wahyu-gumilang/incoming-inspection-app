<div class="items-page item-detail-page" x-data="{ activeSection: null }">
    <x-ui.page-header
        eyebrow="Master Data"
        :title="$item->name"
        :description="'Part number '.$item->itemid.' · '.number_format($item->standards_count).' standards'"
    >
        <x-slot:actions>
            <x-ui.button variant="ghost" :href="route('items.index')" icon="arrow-left">
                Back to items
            </x-ui.button>

            @if ($canManage)
                <x-ui.button variant="primary" icon="pencil" wire:click="openEdit">Edit name</x-ui.button>
            @else
                <x-ui.badge variant="neutral">View only</x-ui.badge>
            @endif
        </x-slot:actions>
    </x-ui.page-header>

    @if ($statusMessage)
        <x-ui.alert variant="success">{{ $statusMessage }}</x-ui.alert>
    @endif

    <div class="item-detail-stats">
        @foreach ($sections as $key => $section)
            @php
                $sectionId = 'item-section-'.\Illuminate\Support\Str::slug($key);
            @endphp

            <button
                type="button"
                class="card item-detail-stat type-{{ $section['tone'] }}"
                x-on:click="activeSection = '{{ $sectionId }}'; document.getElementById('{{ $sectionId }}').scrollIntoView({ behavior: 'smooth', block: 'start' })"
                x-bind:class="{ 'is-active': activeSection === '{{ $sectionId }}' }"
                x-bind:aria-pressed="activeSection === '{{ $sectionId }}'"
            >
                <span class="item-detail-stat-icon">
                    <x-icon :name="$section['icon']" :size="20" />
                </span>
                <span class="item-detail-stat-copy">
                    <span class="item-detail-stat-label">{{ $section['label'] }}</span>
                    <strong>{{ $groups[$key]->count() }}</strong>
                    <small>{{ $section['description'] }}</small>
                </span>
            </button>
        @endforeach
    </div>

    <div class="item-standard-sections">
        @foreach ($sections as $key => $section)
            @php
                $standards = $groups[$key];
                $sectionId = 'item-section-'.\Illuminate\Support\Str::slug($key);
            @endphp

            <section
                class="card item-standard-card type-{{ $section['tone'] }}"
                id="{{ $sectionId }}"
                x-bind:class="{ 'is-focused': activeSection === '{{ $sectionId }}' }"
            >
                <div class="item-standard-head">
                    <div class="item-standard-title">
                        <span class="item-standard-icon">
                            <x-icon :name="$section['icon']" :size="20" />
                        </span>
                        <span class="item-standard-copy">
                            <span class="item-standard-kicker">{{ $section['description'] }}</span>
                            <h2>{{ $section['label'] }}</h2>
                        </span>
                    </div>

                    <span class="item-standard-count">{{ $standards->count() }}</span>
                </div>

                @if ($standards->isEmpty())
                    <div class="item-standard-empty">
                        <x-icon :name="$section['icon']" :size="18" />
                        <span>{{ $section['empty'] }}</span>
                    </div>
                @else
                    <div class="items-table-wrap">
                        <table class="items-table item-standard-table">
                            <thead>
                                <tr>
                                    <th>{{ $key === 'STD' ? 'Characteristic' : 'Requirement' }}</th>
                                    <th>Standard</th>
                                    <th>Tolerance</th>
                                    @if ($key === 'STD')
                                        <th>Min</th>
                                        <th>Max</th>
                                    @endif
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($standards as $standard)
                                    @php
                                        $standardText = trim((string) $standard->standard_txt);

                                        if ($standardText === '' && is_numeric($standard->standard)) {
                                            $standardText = number_format((float) $standard->standard, 2);
                                        }

                                        $tolerance = trim((string) $standard->tolerance);
                                        $minimum = null;
                                        $maximum = null;

                                        if ($key === 'STD' && is_numeric($standard->standard)) {
                                            $base = (float) $standard->standard;
                                            $minimum = number_format($base - abs((float) $standard->tolerance_minus), 2);
                                            $maximum = number_format($base + abs((float) $standard->tolerance_plus), 2);
                                        }
                                    @endphp

                                    <tr wire:key="standard-{{ $key }}-{{ $loop->index }}">
                                        <td>
                                            <span class="item-standard-name">
                                                {{ trim((string) $standard->inspectitem) ?: '—' }}
                                            </span>
                                        </td>
                                        <td class="item-standard-value">{{ $standardText ?: '—' }}</td>
                                        <td>{{ $tolerance ?: '—' }}</td>

                                        @if ($key === 'STD')
                                            <td class="item-standard-number">{{ $minimum ?? '—' }}</td>
                                            <td class="item-standard-number">{{ $maximum ?? '—' }}</td>
                                        @endif
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                @endif
            </section>
        @endforeach
    </div>

    @if ($showEdit)
        <x-ui.modal
            title="Rename item"
            :subtitle="'Part number '.$item->itemid.' is permanent.'"
            close="closeEdit"
        >
            <form wire:submit="save" class="form">
                <x-ui.field label="Item name" for="edit-item-name" name="name">
                    <input
                        id="edit-item-name"
                        class="input"
                        type="text"
                        wire:model="name"
                        maxlength="100"
                        autofocus
                    >
                </x-ui.field>

                <div class="modal-foot">
                    <x-ui.button variant="secondary" type="button" icon="x" wire:click="closeEdit">Cancel</x-ui.button>
                    <x-ui.button variant="primary" type="submit" icon="save" wire:loading.attr="disabled">Save name</x-ui.button>
                </div>
            </form>
        </x-ui.modal>
    @endif
</div>
