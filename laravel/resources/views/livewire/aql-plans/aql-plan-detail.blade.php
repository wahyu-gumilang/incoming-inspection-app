<div class="aql-plans-page">
    <div class="aql-plan-detail-embedded-head">
        <x-ui.button variant="ghost" size="sm" icon="arrow-left" wire:click="backToPlans">
            All plans
        </x-ui.button>

        <div class="aql-plan-detail-embedded-title">
            <span class="aql-plan-detail-kicker">AQL Plan</span>
            <h2>{{ $plan->name }}</h2>
            <p>Level {{ $plan->inspectlevel }} · AQL {{ $plan->aql }} · {{ $plan->row_count }} sampling rows</p>
        </div>

        @if ($canManage)
            <x-ui.button variant="primary" size="sm" icon="pencil" wire:click="openEditPlan">Edit plan</x-ui.button>
        @else
            <x-ui.badge variant="neutral">View only</x-ui.badge>
        @endif
    </div>

    @if ($statusMessage)
        <x-ui.alert variant="success">{{ $statusMessage }}</x-ui.alert>
    @endif

    @if ($errorMessage)
        <x-ui.alert variant="error">{{ $errorMessage }}</x-ui.alert>
    @endif

    <div class="card aql-plan-detail-summary">
        <div class="aql-plan-detail-copy">
            <div class="aql-plan-detail-meta">
                @if ((int) $plan->isdefault === 1)
                    <x-ui.badge variant="success">Default plan</x-ui.badge>
                @else
                    <x-ui.badge variant="neutral">Not default</x-ui.badge>
                @endif

                <span class="aql-plan-meta-pill">
                    Level <strong>{{ $plan->inspectlevel }}</strong>
                </span>
                <span class="aql-plan-meta-pill">
                    AQL <strong>{{ $plan->aql }}</strong>
                </span>
                <span class="aql-plan-meta-pill">
                    <strong>{{ $plan->row_count }}</strong> sampling rows
                </span>
            </div>

            @if ($plan->note)
                <p class="aql-plan-detail-note">{{ $plan->note }}</p>
            @else
                <p class="aql-plan-detail-note">No plan note.</p>
            @endif
        </div>

        @if ($canManage)
            <div class="aql-plan-detail-actions">
                @if ((int) $plan->isdefault !== 1)
                    <x-ui.button variant="secondary" icon="check" wire:click="setDefault">
                        Set default
                    </x-ui.button>
                @endif

                <x-ui.button
                    variant="danger"
                    icon="trash-2"
                    :disabled="(int) $plan->inspection_count > 0 || (int) $planCount <= 1"
                    wire:click="confirmDeletePlan"
                >
                    Delete plan
                </x-ui.button>
            </div>
        @endif
    </div>

    <div class="card aql-plan-rows-card">
        <div class="aql-plan-rows-head">
            <div>
                <h2>Sampling rows</h2>
                <p>Acceptance rules by inspection category and lot size. An empty maximum means no upper limit.</p>
            </div>

            @if ($canManage)
                <x-ui.button variant="primary" size="sm" icon="plus" wire:click="openCreateRow">
                    Add row
                </x-ui.button>
            @endif
        </div>

        @if ($rows->isEmpty())
            <div class="aql-plan-rows-empty">
                <x-ui.empty-state
                    icon="table"
                    title="No sampling rows"
                    description="Add the first row for this plan."
                >
                    @if ($canManage)
                        <x-slot:actions>
                            <x-ui.button variant="primary" icon="plus" wire:click="openCreateRow">Add row</x-ui.button>
                        </x-slot:actions>
                    @endif
                </x-ui.empty-state>
            </div>
        @else
            <div class="aql-plans-table-wrap">
                <table class="items-table aql-plan-rows-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Lot range</th>
                            <th>Code</th>
                            <th>Sample</th>
                            <th>Ac</th>
                            <th>Re</th>
                            @if ($canManage)
                                <th class="aql-plan-actions-head">Actions</th>
                            @endif
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($rows as $row)
                            @php($category = $categories[(int) $row->inspectcategory] ?? ['label' => '—', 'class' => ''])
                            <tr wire:key="aql-row-{{ $row->inspectcategory }}-{{ $row->lotmin }}">
                                <td>
                                    <span class="aql-plan-category {{ $category['class'] }}">{{ $category['label'] }}</span>
                                </td>
                                <td>
                                    <span class="aql-plan-lot">{{ $row->lotmin }} – {{ $row->lotmax ?? '∞' }}</span>
                                </td>
                                <td><span class="aql-plan-code">{{ $row->codeletter }}</span></td>
                                <td><span class="aql-plan-number">{{ $row->samplesize }}</span></td>
                                <td><span class="aql-plan-number">{{ $row->acceptnum }}</span></td>
                                <td><span class="aql-plan-number">{{ $row->rejectnum }}</span></td>
                                @if ($canManage)
                                    <td>
                                        <div class="aql-plan-row-actions">
                                            <x-ui.icon-button
                                                icon="pencil"
                                                :label="'Edit row '.$row->lotmin.'-'.($row->lotmax ?? 'no upper limit')"
                                                wire:click="openEditRow({{ $row->inspectcategory }}, {{ $row->lotmin }})"
                                            />

                                            <x-ui.icon-button
                                                icon="trash-2"
                                                variant="danger"
                                                :label="'Delete row '.$row->lotmin.'-'.($row->lotmax ?? 'no upper limit')"
                                                wire:click="confirmDeleteRow({{ $row->inspectcategory }}, {{ $row->lotmin }})"
                                            />
                                        </div>
                                    </td>
                                @endif
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif
    </div>

    @if ($showEditPlan)
        <x-ui.modal
            title="Edit AQL plan"
            subtitle="Update the plan metadata. Sampling rows are managed separately."
            close="closeEditPlan"
        >
            <form wire:submit="savePlan" class="form">
                <x-ui.field label="Plan name" for="detail-plan-name" name="name">
                    <input
                        id="detail-plan-name"
                        class="input"
                        type="text"
                        wire:model="name"
                        maxlength="100"
                        autocomplete="off"
                        autofocus
                    >
                </x-ui.field>

                <div class="aql-plan-form-grid">
                    <x-ui.field label="Inspection level" for="detail-plan-level" name="inspectlevel">
                        <input
                            id="detail-plan-level"
                            class="input"
                            type="text"
                            wire:model="inspectlevel"
                            maxlength="10"
                            autocomplete="off"
                        >
                    </x-ui.field>

                    <x-ui.field label="AQL value" for="detail-plan-aql" name="aql">
                        <input
                            id="detail-plan-aql"
                            class="input"
                            type="text"
                            wire:model="aql"
                            maxlength="20"
                            autocomplete="off"
                        >
                    </x-ui.field>
                </div>

                <x-ui.field label="Plan note" for="detail-plan-note" name="note">
                    <textarea
                        id="detail-plan-note"
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
                    <x-ui.button variant="secondary" type="button" icon="x" wire:click="closeEditPlan">Cancel</x-ui.button>
                    <x-ui.button variant="primary" type="submit" icon="save" wire:loading.attr="disabled">Save changes</x-ui.button>
                </div>
            </form>
        </x-ui.modal>
    @endif

    @if ($showRow)
        <x-ui.modal
            :title="$editingRow ? 'Edit sampling row' : 'Add sampling row'"
            :subtitle="'Plan '.$plan->name.' · '.$plan->inspectlevel.' / '.$plan->aql"
            close="closeRow"
        >
            <form wire:submit="saveRow" class="form">
                <x-ui.field label="Inspection category" for="aql-row-category" name="rowCategory">
                    <x-ui.select id="aql-row-category" wire:model="rowCategory">
                        @foreach ($categories as $categoryValue => $category)
                            <option value="{{ $categoryValue }}">{{ $category['label'] }}</option>
                        @endforeach
                    </x-ui.select>
                </x-ui.field>

                <div class="aql-plan-row-form-grid is-two">
                    <x-ui.field label="Lot minimum" for="aql-row-lotmin" name="rowLotmin">
                        <input
                            id="aql-row-lotmin"
                            class="input"
                            type="number"
                            min="1"
                            step="1"
                            wire:model="rowLotmin"
                        >
                    </x-ui.field>

                    <x-ui.field
                        label="Lot maximum"
                        for="aql-row-lotmax"
                        name="rowLotmax"
                        hint="Leave empty for no upper limit."
                    >
                        <input
                            id="aql-row-lotmax"
                            class="input"
                            type="number"
                            min="1"
                            step="1"
                            wire:model="rowLotmax"
                            placeholder="No upper limit"
                        >
                    </x-ui.field>
                </div>

                <div class="aql-plan-row-form-grid">
                    <x-ui.field label="Code letter" for="aql-row-code" name="rowCodeletter" hint="Up to 2 characters.">
                        <input
                            id="aql-row-code"
                            class="input"
                            type="text"
                            wire:model="rowCodeletter"
                            maxlength="2"
                            autocomplete="off"
                        >
                    </x-ui.field>

                    <x-ui.field label="Sample size" for="aql-row-sample" name="rowSamplesize">
                        <input
                            id="aql-row-sample"
                            class="input"
                            type="number"
                            min="1"
                            step="1"
                            wire:model="rowSamplesize"
                        >
                    </x-ui.field>

                    <x-ui.field label="Ac" for="aql-row-accept" name="rowAcceptnum">
                        <input
                            id="aql-row-accept"
                            class="input"
                            type="number"
                            min="0"
                            step="1"
                            wire:model="rowAcceptnum"
                        >
                    </x-ui.field>

                    <x-ui.field label="Re" for="aql-row-reject" name="rowRejectnum">
                        <input
                            id="aql-row-reject"
                            class="input"
                            type="number"
                            min="1"
                            step="1"
                            wire:model="rowRejectnum"
                        >
                    </x-ui.field>
                </div>

                <div class="modal-foot">
                    <x-ui.button variant="secondary" type="button" icon="x" wire:click="closeRow">Cancel</x-ui.button>
                    <x-ui.button variant="primary" type="submit" icon="save" wire:loading.attr="disabled">
                        {{ $editingRow ? 'Save row' : 'Add row' }}
                    </x-ui.button>
                </div>
            </form>
        </x-ui.modal>
    @endif

    @if ($showDeleteRow)
        <x-ui.confirm
            title="Delete sampling row"
            close="closeDeleteRow"
            confirm="deleteRow"
            confirm-label="Delete"
            confirm-icon="trash-2"
            variant="danger"
        >
            <p>
                Delete row <strong>{{ $deleteRowLabel }}</strong> from this AQL plan?
                This cannot be undone.
            </p>
            @error('deleteRow')
                <p class="field-error">{{ $message }}</p>
            @enderror
        </x-ui.confirm>
    @endif

    @if ($showDeletePlan)
        <x-ui.confirm
            title="Delete AQL plan"
            close="closeDeletePlan"
            confirm="deletePlan"
            confirm-label="Delete plan"
            confirm-icon="trash-2"
            variant="danger"
        >
            <p>
                Delete <strong>{{ $deletePlanName }}</strong> and all of its sampling rows?
                This cannot be undone.
            </p>
            @error('deletePlan')
                <p class="field-error">{{ $message }}</p>
            @enderror
        </x-ui.confirm>
    @endif
</div>
