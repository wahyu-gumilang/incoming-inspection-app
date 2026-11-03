<div class="inspection-workflow">
    @if ($errorMessage)
        <x-ui.alert variant="error">{{ $errorMessage }}</x-ui.alert>
    @endif

    <div class="inspection-workflow-bar">
        <div class="inspection-workflow-state">
            <x-ui.badge :variant="\App\Domain\Inspection\InspectionStatus::badgeVariant($status)">
                {{ \App\Domain\Inspection\InspectionStatus::label($status) }}
            </x-ui.badge>

            <div class="inspection-workflow-copy">
                <strong>{{ $inspection->inspectnum }}</strong>

                @if ($status === \App\Domain\Inspection\InspectionStatus::SUBMITTED && $inspection->submitted_at)
                    <span>Submitted {{ \Illuminate\Support\Carbon::parse($inspection->submitted_at)->format('d M Y H:i') }}</span>
                @elseif ($status === \App\Domain\Inspection\InspectionStatus::CHECKED && $inspection->checked_at)
                    <span>
                        Checked by {{ $inspection->checkedby }}
                        · {{ \Illuminate\Support\Carbon::parse($inspection->checked_at)->format('d M Y H:i') }}
                    </span>
                @elseif ($status === \App\Domain\Inspection\InspectionStatus::RETURNED && $inspection->returned_at)
                    <span>
                        Returned by {{ $inspection->checkedby }}
                        · {{ \Illuminate\Support\Carbon::parse($inspection->returned_at)->format('d M Y H:i') }}
                    </span>
                @else
                    <span>Not submitted for checking yet.</span>
                @endif
            </div>
        </div>

        <div class="inspection-workflow-actions">
            @if ($canEdit)
                <x-ui.button
                    variant="secondary"
                    icon="pencil"
                    :href="route('aql.edit', ['inspectnum' => $inspection->inspectnum])"
                >
                    Edit inspection
                </x-ui.button>
            @endif

            @if ($canSubmit)
                <x-ui.button variant="primary" icon="upload" wire:click="submit" wire:loading.attr="disabled">
                    Submit for checking
                </x-ui.button>
            @endif

            @if ($canCheck)
                <x-ui.button variant="success" icon="check" wire:click="approve" wire:loading.attr="disabled">
                    Approve
                </x-ui.button>

                <x-ui.button variant="danger" icon="rotate-ccw" wire:click="openReturn" wire:loading.attr="disabled">
                    Return
                </x-ui.button>
            @endif
        </div>
    </div>

    @if ($status === \App\Domain\Inspection\InspectionStatus::RETURNED && $inspection->return_note)
        <div class="inspection-workflow-return-note">
            <x-icon name="alert-triangle" :size="16" />
            <span><strong>Return reason:</strong> {{ $inspection->return_note }}</span>
        </div>
    @endif

    @if ($showReturn)
        <x-ui.modal
            title="Return inspection"
            subtitle="The inspector can revise this report and submit it again."
            close="closeReturn"
        >
            <form wire:submit="returnToInspector" class="form">
                <x-ui.field
                    label="Return reason"
                    for="inspection-return-note"
                    name="returnNote"
                    hint="Explain what the inspector needs to correct."
                >
                    <textarea
                        id="inspection-return-note"
                        class="input inspection-return-note-input"
                        wire:model="returnNote"
                        maxlength="255"
                        autofocus
                    ></textarea>
                </x-ui.field>

                <div class="modal-foot">
                    <x-ui.button variant="secondary" type="button" icon="x" wire:click="closeReturn">Cancel</x-ui.button>
                    <x-ui.button variant="danger" type="submit" icon="rotate-ccw" wire:loading.attr="disabled">
                        Return inspection
                    </x-ui.button>
                </div>
            </form>
        </x-ui.modal>
    @endif
</div>
