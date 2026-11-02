<div class="inspection-page">
    <x-ui.page-header
        eyebrow="Inspection"
        title="AQL Table"
        description="Fill the inspection measurements, deliveries, and AQL results."
    >
        <x-slot:actions>
            <x-ui.button variant="primary" icon="save" wire:click="save" wire:loading.attr="disabled">
                Save inspection
            </x-ui.button>
        </x-slot:actions>
    </x-ui.page-header>

    @if ($errors->any())
        <x-ui.alert variant="error">
            <ul>
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </x-ui.alert>
    @endif

    <form wire:submit="save" class="inspection-form">
        <div class="card inspection-header-card">
            <div class="inspection-header-grid">
                <x-ui.field label="Item" for="inspection-item" name="itemid">
                    <select id="inspection-item" class="select" wire:model.live="itemid">
                        <option value="">Choose an item...</option>
                        @foreach ($items as $id => $name)
                            <option value="{{ $id }}">{{ $id }} — {{ $name }}</option>
                        @endforeach
                    </select>
                </x-ui.field>

                <x-ui.field label="Supplier" for="inspection-vendor" name="accountnum">
                    <select id="inspection-vendor" class="select" wire:model="accountnum">
                        <option value="">Choose a supplier...</option>
                        @foreach ($vendors as $id => $name)
                            <option value="{{ $id }}">{{ $id }} — {{ $name }}</option>
                        @endforeach
                    </select>
                </x-ui.field>

                <x-ui.field label="AQL plan" for="inspection-plan" name="planid">
                    <select id="inspection-plan" class="select" wire:model.live="planid">
                        <option value="">Choose a plan...</option>
                        @foreach ($plans as $plan)
                            <option value="{{ $plan->planid }}">
                                {{ $plan->name }} · {{ $plan->inspectlevel }} / {{ $plan->aql }}
                                {{ $plan->isdefault ? ' · Default' : '' }}
                            </option>
                        @endforeach
                    </select>
                </x-ui.field>

                <x-ui.field label="Measuring instrument" for="inspection-instrument" name="instrument">
                    <input id="inspection-instrument" class="input" type="text" wire:model="instrument" maxlength="100">
                </x-ui.field>

                <x-ui.field label="QF No." for="inspection-qf" name="qfnum">
                    <input id="inspection-qf" class="input" type="text" wire:model="qfnum" maxlength="50">
                </x-ui.field>
            </div>
        </div>

        <div class="card inspection-section-card">
            <div class="inspection-section-heading">
                <div>
                    <h2>Delivery and AQL</h2>
                    <p>Fill up to seven deliveries. Sample, Ac, and Re are calculated from the selected plan.</p>
                </div>
                <x-ui.badge variant="info">N / R / T / 100%</x-ui.badge>
            </div>

            <div class="inspection-table-wrap">
                <table class="inspection-table inspection-delivery-table">
                    <thead>
                        <tr>
                            <th>Field</th>
                            @for ($column = 1; $column <= 7; $column++)
                                <th>Delivery {{ $column }}</th>
                            @endfor
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th>P/O No.</th>
                            @for ($column = 1; $column <= 7; $column++)
                                <td>
                                    <input class="inspection-input" type="text" wire:model="deliveries.{{ $column }}.po" maxlength="30">
                                </td>
                            @endfor
                        </tr>
                        <tr>
                            <th>Delivery date</th>
                            @for ($column = 1; $column <= 7; $column++)
                                <td>
                                    <input class="inspection-input" type="date" wire:model="deliveries.{{ $column }}.date">
                                </td>
                            @endfor
                        </tr>
                        <tr>
                            <th>QTY received</th>
                            @for ($column = 1; $column <= 7; $column++)
                                <td>
                                    <input class="inspection-input" type="number" min="0" step="1" wire:model.live.debounce.300ms="deliveries.{{ $column }}.qty">
                                </td>
                            @endfor
                        </tr>
                        <tr>
                            <th>Insp. Category</th>
                            @for ($column = 1; $column <= 7; $column++)
                                <td>
                                    <select class="inspection-input" wire:model.live="deliveries.{{ $column }}.category">
                                        <option value="">—</option>
                                        <option value="1">N — Normal</option>
                                        <option value="2">R — Reduce</option>
                                        <option value="3">T — Tightening</option>
                                        <option value="0">100% inspection</option>
                                    </select>
                                </td>
                            @endfor
                        </tr>
                        <tr class="inspection-calculated-row">
                            <th>Sample size</th>
                            @for ($column = 1; $column <= 7; $column++)
                                <td>{{ $aql[$column]['samplesize'] ?? '—' }}</td>
                            @endfor
                        </tr>
                        <tr class="inspection-calculated-row">
                            <th>Accept / Reject</th>
                            @for ($column = 1; $column <= 7; $column++)
                                <td>
                                    {{ $aql[$column]['acceptnum'] ?? '—' }}
                                    /
                                    {{ $aql[$column]['rejectnum'] ?? '—' }}
                                </td>
                            @endfor
                        </tr>
                        <tr>
                            <th>NG pieces</th>
                            @for ($column = 1; $column <= 7; $column++)
                                <td>
                                    <input class="inspection-input" type="number" min="0" step="1" wire:model.live.debounce.300ms="deliveries.{{ $column }}.notgood">
                                </td>
                            @endfor
                        </tr>
                        <tr class="inspection-calculated-row">
                            <th>Suggested</th>
                            @for ($column = 1; $column <= 7; $column++)
                                <td>
                                    @php
                                        $suggestion = $suggested[$column] ?? 0;
                                    @endphp
                                    @if ($suggestion === 1)
                                        <span class="inspection-status is-ok">O</span>
                                    @elseif ($suggestion === 2)
                                        <span class="inspection-status is-ng">X</span>
                                    @else
                                        —
                                    @endif
                                </td>
                            @endfor
                        </tr>
                        <tr>
                            <th>Judgment</th>
                            @for ($column = 1; $column <= 7; $column++)
                                <td>
                                    <select class="inspection-input" wire:model="deliveries.{{ $column }}.judgment">
                                        <option value="0">—</option>
                                        <option value="1">O — Accepted</option>
                                        <option value="2">X — Rejected</option>
                                        <option value="3">C — Concession</option>
                                    </select>
                                </td>
                            @endfor
                        </tr>
                        <tr>
                            <th>Concession note</th>
                            @for ($column = 1; $column <= 7; $column++)
                                <td>
                                    <input class="inspection-input" type="text" wire:model="deliveries.{{ $column }}.note" maxlength="255">
                                </td>
                            @endfor
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card inspection-section-card">
            <div class="inspection-section-heading">
                <div>
                    <h2>Dimensions</h2>
                    <p>Enter the actual values. OK/NG is calculated from the standard and tolerances.</p>
                </div>
                <x-ui.badge variant="neutral">{{ count($stdLines) }} standards</x-ui.badge>
            </div>

            @if ($stdLines === [])
                <x-ui.empty-state
                    icon="clipboard-check"
                    title="Select an item"
                    description="Choose an item to load its dimensional standards."
                />
            @else
                <div class="inspection-table-wrap">
                    <table class="inspection-table inspection-lines-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Item</th>
                                <th>Standard</th>
                                <th>Tolerance</th>
                                @for ($column = 1; $column <= 7; $column++)
                                    <th colspan="2">Delivery {{ $column }}</th>
                                @endfor
                            </tr>
                            <tr>
                                <th></th>
                                <th></th>
                                <th></th>
                                <th></th>
                                @for ($column = 1; $column <= 7; $column++)
                                    <th>Actual</th>
                                    <th>OK/NG</th>
                                @endfor
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($stdLines as $index => $line)
                                <tr>
                                    <td class="inspection-line-number">{{ $loop->iteration }}</td>
                                    <td>{{ $line['inspectitem'] }}</td>
                                    <td>{{ $line['standard_txt'] ?: $line['standard'] }}</td>
                                    <td>{{ $line['tolerance'] }}</td>
                                    @for ($column = 1; $column <= 7; $column++)
                                        <td>
                                            <input class="inspection-input" type="number" step="0.01" wire:model="stdLines.{{ $index }}.actuals.{{ $column }}">
                                        </td>
                                        <td>
                                            @php
                                                $status = $standardStatuses[$index][$column] ?? null;
                                            @endphp
                                            @if ($status === 1)
                                                <span class="inspection-status is-ok">OK</span>
                                            @elseif ($status === 0)
                                                <span class="inspection-status is-ng">NG</span>
                                            @else
                                                <span class="inspection-status is-empty">—</span>
                                            @endif
                                        </td>
                                    @endfor
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            @endif
        </div>

        <div class="card inspection-section-card">
            <div class="inspection-section-heading">
                <div>
                    <h2>Visual, Fitting, and Certificate</h2>
                    <p>Enter the result and choose OK or NG for each delivery.</p>
                </div>
                <x-ui.badge variant="neutral">{{ count($otherLines) }} requirements</x-ui.badge>
            </div>

            @if ($otherLines === [])
                <p class="inspection-muted">This item has no visual, fitting, or certificate requirements.</p>
            @else
                <div class="inspection-table-wrap">
                    <table class="inspection-table inspection-lines-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Section</th>
                                <th>Requirement</th>
                                @for ($column = 1; $column <= 7; $column++)
                                    <th colspan="2">Delivery {{ $column }}</th>
                                @endfor
                            </tr>
                            <tr>
                                <th></th>
                                <th></th>
                                <th></th>
                                @for ($column = 1; $column <= 7; $column++)
                                    <th>Actual</th>
                                    <th>Status</th>
                                @endfor
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($otherLines as $index => $line)
                                <tr>
                                    <td class="inspection-line-number">{{ $loop->iteration }}</td>
                                    <td>{{ $line['inspecttype'] }}</td>
                                    <td>{{ $line['inspectitem'] }}</td>
                                    @for ($column = 1; $column <= 7; $column++)
                                        <td>
                                            <input class="inspection-input" type="text" wire:model="otherLines.{{ $index }}.actuals.{{ $column }}" maxlength="100">
                                        </td>
                                        <td>
                                            <select class="inspection-input" wire:model="otherLines.{{ $index }}.statuses.{{ $column }}">
                                                <option value="">—</option>
                                                <option value="1">OK</option>
                                                <option value="0">NG</option>
                                            </select>
                                        </td>
                                    @endfor
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            @endif
        </div>

        <div class="inspection-actions">
            <x-ui.button variant="primary" type="submit" icon="save" wire:loading.attr="disabled">
                Save inspection
            </x-ui.button>
        </div>
    </form>
</div>
