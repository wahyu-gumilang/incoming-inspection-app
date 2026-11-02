<div class="aql-plans-page">
    @if ($statusMessage)
        <x-ui.alert variant="success">{{ $statusMessage }}</x-ui.alert>
    @endif

    @if ($errorMessage)
        <x-ui.alert variant="error">{{ $errorMessage }}</x-ui.alert>
    @endif

    @if ($selectedPlanid !== null)
        <livewire:aql-plans.aql-plan-detail :planid="$selectedPlanid" :key="'aql-plan-detail-'.$selectedPlanid" />
    @else

    <div class="aql-plan-summary">
        <div class="aql-plan-summary-item">
            <span class="aql-plan-summary-label">Plans</span>
            <strong>{{ number_format($totalPlans) }}</strong>
            <small>Available sampling plans</small>
        </div>

        <div class="aql-plan-summary-item">
            <span class="aql-plan-summary-label">Sampling rows</span>
            <strong>{{ number_format($totalRows) }}</strong>
            <small>Acceptance rules in total</small>
        </div>

        <div class="aql-plan-summary-item aql-plan-summary-default">
            <span class="aql-plan-summary-label">Default plan</span>
            <strong>{{ $defaultPlan?->name ?? '—' }}</strong>
            <small>
                @if ($defaultPlan)
                    {{ $defaultPlan->inspectlevel }} · AQL {{ $defaultPlan->aql }}
                @else
                    No plan selected
                @endif
            </small>
        </div>
    </div>

    <div class="card aql-plans-panel">
        <div class="aql-plans-toolbar">
            <x-ui.search
                wire:model.live.debounce.300ms="search"
                placeholder="Search plan name, level, or AQL..."
                label="Search AQL plans"
            />

            @if ($canManage)
                <x-ui.button variant="primary" size="sm" icon="plus" wire:click="openCreate">Add plan</x-ui.button>
            @endif

            <span class="aql-plans-count">
                {{ number_format($plans->total()) }} plan{{ $plans->total() === 1 ? '' : 's' }}
            </span>
        </div>

        @if ($plans->isEmpty())
            <div class="aql-plans-empty">
                <x-ui.empty-state
                    icon="settings"
                    title="No AQL plans found"
                    description="Try another search, or create the first sampling plan."
                >
                    @if ($search !== '')
                        <x-slot:actions>
                            <x-ui.button variant="secondary" icon="rotate-ccw" wire:click="resetSearch">Clear search</x-ui.button>
                        </x-slot:actions>
                    @endif
                </x-ui.empty-state>
            </div>
        @else
            <div class="aql-plans-table-wrap">
                <table class="items-table aql-plans-table">
                    <thead>
                        <tr>
                            <th>Plan</th>
                            <th>Level</th>
                            <th>AQL</th>
                            <th>Rows</th>
                            <th>Default</th>
                            <th>Updated</th>
                            @if ($canManage)
                                <th class="aql-plan-actions-head">Actions</th>
                            @endif
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($plans as $plan)
                            <tr wire:key="aql-plan-{{ $plan->planid }}">
                                <td>
                                    <div class="aql-plan-main">
                                        <span class="aql-plan-name">{{ $plan->name }}</span>
                                        @if ($plan->note)
                                            <span class="aql-plan-note" title="{{ $plan->note }}">{{ \Illuminate\Support\Str::limit($plan->note, 96) }}</span>
                                        @endif
                                    </div>
                                </td>
                                <td><span class="aql-plan-level">{{ $plan->inspectlevel }}</span></td>
                                <td><span class="aql-plan-aql">{{ $plan->aql }}</span></td>
                                <td>
                                    <span class="aql-plan-rows">
                                        {{ number_format((int) $plan->row_count) }}
                                        {{ (int) $plan->row_count === 1 ? 'row' : 'rows' }}
                                    </span>
                                </td>
                                <td>
                                    @if ((int) $plan->isdefault === 1)
                                        <x-ui.badge variant="success">Default</x-ui.badge>
                                    @elseif ($canManage)
                                        <button
                                            type="button"
                                            class="aql-plan-default-action"
                                            wire:click="setDefault({{ $plan->planid }})"
                                        >
                                            <x-icon name="check" :size="13" />
                                            Set default
                                        </button>
                                    @else
                                        <span class="aql-plan-muted">—</span>
                                    @endif
                                </td>
                                <td>
                                    <span class="aql-plan-updated">
                                        {{ \Illuminate\Support\Carbon::parse($plan->updated_at)->format('d M Y') }}
                                    </span>
                                </td>
                                @if ($canManage)
                                    <td>
                                        <div class="aql-plan-actions">
                                            <x-ui.button
                                                variant="ghost"
                                                size="sm"
                                                icon="table"
                                                wire:click="openPlan({{ $plan->planid }})"
                                            >
                                                Rows
                                            </x-ui.button>

                                            <x-ui.icon-button
                                                icon="pencil"
                                                :label="'Edit '.$plan->name"
                                                wire:click="openEdit({{ $plan->planid }})"
                                            />

                                            <x-ui.icon-button
                                                icon="trash-2"
                                                variant="danger"
                                                :label="(int) $plan->inspection_count > 0
                                                    ? 'Cannot delete '.$plan->name.': used by inspections'
                                                    : ((int) $totalPlans <= 1
                                                        ? 'Cannot delete the only AQL plan'
                                                        : 'Delete '.$plan->name)"
                                                :disabled="(int) $plan->inspection_count > 0 || (int) $totalPlans <= 1"
                                                wire:click="confirmDelete({{ $plan->planid }})"
                                            />
                                        </div>
                                    </td>
                                @endif
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>

            <div class="aql-plans-footer">
                <span class="aql-plans-count">
                    Showing {{ $plans->firstItem() }}-{{ $plans->lastItem() }} of
                    {{ number_format($plans->total()) }} plans
                </span>

                <x-ui.pagination :paginator="$plans" />
            </div>
        @endif
    </div>

    @endif

    @if ($showCreate)
        <x-ui.modal
            title="Add AQL plan"
            subtitle="Create a sampling plan for incoming inspection."
            close="closeCreate"
        >
            <form wire:submit="createPlan" class="form">
                <x-ui.field label="Plan name" for="aql-plan-name" name="name">
                    <input
                        id="aql-plan-name"
                        class="input"
                        type="text"
                        wire:model="name"
                        maxlength="100"
                        autocomplete="off"
                        autofocus
                    >
                </x-ui.field>

                <div class="aql-plan-form-grid">
                    <x-ui.field
                        label="Inspection level"
                        for="aql-plan-level"
                        name="inspectlevel"
                        hint="For example S-1 or II."
                    >
                        <input
                            id="aql-plan-level"
                            class="input"
                            type="text"
                            wire:model="inspectlevel"
                            maxlength="10"
                            autocomplete="off"
                        >
                    </x-ui.field>

                    <x-ui.field
                        label="AQL value"
                        for="aql-plan-aql"
                        name="aql"
                        hint="For example 2.5 or Ac 0."
                    >
                        <input
                            id="aql-plan-aql"
                            class="input"
                            type="text"
                            wire:model="aql"
                            maxlength="20"
                            autocomplete="off"
                        >
                    </x-ui.field>
                </div>

                <x-ui.field
                    label="Plan note"
                    for="aql-plan-note"
                    name="note"
                    hint="Optional context for this plan."
                >
                    <textarea
                        id="aql-plan-note"
                        class="input aql-plan-note-input"
                        wire:model="note"
                        maxlength="255"
                    ></textarea>
                </x-ui.field>

                <label class="check-field">
                    <input type="checkbox" wire:model="makeDefault">
                    <span>Make this the default plan</span>
                </label>

                <div class="modal-foot">
                    <x-ui.button variant="secondary" type="button" icon="x" wire:click="closeCreate">Cancel</x-ui.button>
                    <x-ui.button variant="primary" type="submit" icon="plus" wire:loading.attr="disabled">Create plan</x-ui.button>
                </div>
            </form>
        </x-ui.modal>
    @endif

    @if ($showEdit)
        <x-ui.modal
            title="Edit AQL plan"
            subtitle="Update the plan metadata. Sampling rows are managed separately."
            close="closeEdit"
        >
            <form wire:submit="saveEdit" class="form">
                <x-ui.field label="Plan name" for="edit-aql-plan-name" name="name">
                    <input
                        id="edit-aql-plan-name"
                        class="input"
                        type="text"
                        wire:model="name"
                        maxlength="100"
                        autocomplete="off"
                        autofocus
                    >
                </x-ui.field>

                <div class="aql-plan-form-grid">
                    <x-ui.field label="Inspection level" for="edit-aql-plan-level" name="inspectlevel">
                        <input
                            id="edit-aql-plan-level"
                            class="input"
                            type="text"
                            wire:model="inspectlevel"
                            maxlength="10"
                            autocomplete="off"
                        >
                    </x-ui.field>

                    <x-ui.field label="AQL value" for="edit-aql-plan-aql" name="aql">
                        <input
                            id="edit-aql-plan-aql"
                            class="input"
                            type="text"
                            wire:model="aql"
                            maxlength="20"
                            autocomplete="off"
                        >
                    </x-ui.field>
                </div>

                <x-ui.field label="Plan note" for="edit-aql-plan-note" name="note">
                    <textarea
                        id="edit-aql-plan-note"
                        class="input aql-plan-note-input"
                        wire:model="note"
                        maxlength="255"
                    ></textarea>
                </x-ui.field>

                @if ($editingIsDefault)
                    <p class="aql-plan-default-note">
                        <x-icon name="check" :size="15" />
                        This is the current default plan.
                    </p>
                @else
                    <label class="check-field">
                        <input type="checkbox" wire:model="makeDefault">
                        <span>Make this the default plan</span>
                    </label>
                @endif

                <div class="modal-foot">
                    <x-ui.button variant="secondary" type="button" icon="x" wire:click="closeEdit">Cancel</x-ui.button>
                    <x-ui.button variant="primary" type="submit" icon="save" wire:loading.attr="disabled">Save changes</x-ui.button>
                </div>
            </form>
        </x-ui.modal>
    @endif

    @if ($showDelete)
        <x-ui.confirm
            title="Delete AQL plan"
            close="closeDelete"
            confirm="deletePlan"
            confirm-label="Delete"
            confirm-icon="trash-2"
            variant="danger"
        >
            <p>
                Delete <strong>{{ $deleteName }}</strong>? Its sampling rows will also be removed.
                This cannot be undone.
            </p>
            @error('deletePlan')
                <p class="field-error">{{ $message }}</p>
            @enderror
        </x-ui.confirm>
    @endif
</div>
