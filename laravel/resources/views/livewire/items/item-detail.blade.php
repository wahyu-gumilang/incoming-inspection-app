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

                    <span class="item-standard-actions">
                        <span class="item-standard-count">{{ $standards->count() }}</span>

                        @if ($canManage && in_array($key, ['STD', 'CERTIFIKAT', 'VISUAL', 'FITTING'], true))
                            <x-ui.button
                                variant="ghost"
                                size="sm"
                                icon="plus"
                                wire:click="openStandardCreate('{{ $key }}')"
                            >
                                Add
                            </x-ui.button>
                        @endif
                    </span>
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
                                    @if ($canManage)
                                        <th class="item-standard-action-head">Actions</th>
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

                                        @if ($canManage)
                                            <td class="item-standard-action-cell">
                                                <span class="item-standard-row-actions">
                                                    <x-ui.icon-button
                                                        icon="pencil"
                                                        :label="'Edit '.trim((string) $standard->inspectitem)"
                                                        wire:click="openStandardEdit({{ \Illuminate\Support\Js::from($standard->inspecttype) }}, {{ \Illuminate\Support\Js::from($standard->inspectitem) }})"
                                                    />
                                                    <x-ui.icon-button
                                                        icon="trash-2"
                                                        variant="danger"
                                                        :label="'Delete '.trim((string) $standard->inspectitem)"
                                                        wire:click="confirmStandardDelete({{ \Illuminate\Support\Js::from($standard->inspecttype) }}, {{ \Illuminate\Support\Js::from($standard->inspectitem) }})"
                                                    />
                                                </span>
                                            </td>
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

    @if ($showStandard)
        @php
            $standardSection = $sections[$standardType] ?? [
                'label' => ucfirst(strtolower($standardType)),
                'description' => 'Inspection requirement',
                'icon' => 'package',
                'tone' => 'other',
            ];
        @endphp

        <x-ui.modal
            :title="($editingStandard ? 'Edit ' : 'Add ').$standardSection['label'].' standard'"
            :subtitle="'Part number '.$item->itemid.' · '.$standardSection['description']"
            close="closeStandard"
        >
            <form wire:submit="saveStandard" class="form">
                <div class="standard-form-type type-{{ $standardSection['tone'] }}">
                    <span class="standard-form-type-icon">
                        <x-icon :name="$standardSection['icon']" :size="18" />
                    </span>
                    <span class="standard-form-type-copy">
                        <strong>{{ $standardSection['label'] }}</strong>
                        <small>{{ $standardSection['description'] }}</small>
                    </span>
                    <span class="standard-form-type-key">{{ $standardType }}</span>
                </div>

                <x-ui.field
                    label="Characteristic"
                    for="standard-item"
                    name="standardItem"
                    :hint="$editingStandard ? 'The characteristic is part of the standard key. Delete and recreate it to change the key.' : null"
                >
                    <input
                        id="standard-item"
                        class="input"
                        type="text"
                        wire:model="standardItem"
                        maxlength="100"
                        autocomplete="off"
                        @disabled($editingStandard)
                    >
                </x-ui.field>

                @if ($standardType === 'STD')
                    <x-ui.field label="Standard value" for="standard-value" name="standardValue">
                        <input
                            id="standard-value"
                            class="input mono"
                            type="number"
                            step="0.01"
                            wire:model="standardValue"
                        >
                    </x-ui.field>

                    <x-ui.field label="Tolerance text" for="standard-tolerance" name="tolerance" hint="Example: ±0.4">
                        <input
                            id="standard-tolerance"
                            class="input"
                            type="text"
                            wire:model="tolerance"
                            maxlength="50"
                        >
                    </x-ui.field>

                    <div class="standard-form-grid">
                        <x-ui.field label="Tolerance plus" for="standard-plus" name="tolerancePlus">
                            <input
                                id="standard-plus"
                                class="input mono"
                                type="number"
                                step="0.01"
                                wire:model="tolerancePlus"
                            >
                        </x-ui.field>

                        <x-ui.field label="Tolerance minus" for="standard-minus" name="toleranceMinus">
                            <input
                                id="standard-minus"
                                class="input mono"
                                type="number"
                                step="0.01"
                                wire:model="toleranceMinus"
                            >
                        </x-ui.field>
                    </div>
                @else
                    <x-ui.field label="Standard / requirement" for="standard-text" name="standardText">
                        <input
                            id="standard-text"
                            class="input"
                            type="text"
                            wire:model="standardText"
                            maxlength="100"
                        >
                    </x-ui.field>

                    <x-ui.field label="Tolerance / note" for="standard-tolerance" name="tolerance">
                        <input
                            id="standard-tolerance"
                            class="input"
                            type="text"
                            wire:model="tolerance"
                            maxlength="50"
                            placeholder="Optional"
                        >
                    </x-ui.field>
                @endif

                <div class="modal-foot">
                    <x-ui.button variant="secondary" type="button" icon="x" wire:click="closeStandard">Cancel</x-ui.button>
                    <x-ui.button variant="primary" type="submit" icon="save" wire:loading.attr="disabled">
                        {{ $editingStandard ? 'Save standard' : 'Add standard' }}
                    </x-ui.button>
                </div>
            </form>
        </x-ui.modal>
    @endif

    @if ($showDeleteStandard)
        @php
            $deleteSection = $sections[$deleteStandardType] ?? [
                'label' => ucfirst(strtolower($deleteStandardType)),
            ];
        @endphp

        <x-ui.confirm
            title="Delete standard"
            close="closeStandardDelete"
            confirm="deleteStandard"
            confirm-label="Delete"
            confirm-icon="trash-2"
            variant="danger"
        >
            <p>
                Delete <strong>{{ $deleteStandardItem }}</strong> from the
                <strong>{{ $deleteSection['label'] }}</strong> section? This cannot be undone.
            </p>
            @error('standardDelete')
                <p class="field-error">{{ $message }}</p>
            @enderror
        </x-ui.confirm>
    @endif
</div>
