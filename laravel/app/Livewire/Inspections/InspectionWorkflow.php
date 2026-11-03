<?php

declare(strict_types=1);

namespace App\Livewire\Inspections;

use App\Domain\Inspection\InspectionStatus;
use App\Repositories\InspectionRepository;
use App\Services\InspectionWorkflowService;
use DomainException;
use Illuminate\Contracts\View\View;
use Livewire\Component;

class InspectionWorkflow extends Component
{
    public string $inspectnum;

    public bool $showReturn = false;

    public string $returnNote = '';

    public string $errorMessage = '';

    public function mount(string $inspectnum): void
    {
        $this->inspectnum = $inspectnum;

        abort_if(app(InspectionRepository::class)->find($inspectnum) === null, 404);
    }

    public function submit(): void
    {
        try {
            app(InspectionWorkflowService::class)->submit($this->inspectnum, auth()->user());
        } catch (DomainException $exception) {
            $this->errorMessage = $exception->getMessage();

            return;
        }

        session()->flash('status', 'Inspection submitted for checking.');
        $this->redirectRoute('reports.show', ['inspectnum' => $this->inspectnum], navigate: true);
    }

    public function approve(): void
    {
        try {
            app(InspectionWorkflowService::class)->approve($this->inspectnum, auth()->user());
        } catch (DomainException $exception) {
            $this->errorMessage = $exception->getMessage();

            return;
        }

        session()->flash('status', 'Inspection approved and checked.');
        $this->redirectRoute('reports.show', ['inspectnum' => $this->inspectnum], navigate: true);
    }

    public function openReturn(): void
    {
        $this->showReturn = true;
        $this->returnNote = '';
        $this->errorMessage = '';
        $this->resetValidation();
    }

    public function closeReturn(): void
    {
        $this->showReturn = false;
        $this->returnNote = '';
        $this->errorMessage = '';
        $this->resetValidation();
    }

    public function returnToInspector(): void
    {
        $this->returnNote = trim($this->returnNote);

        $this->validate([
            'returnNote' => ['required', 'string', 'max:255'],
        ]);

        try {
            app(InspectionWorkflowService::class)->returnToInspector(
                $this->inspectnum,
                auth()->user(),
                $this->returnNote,
            );
        } catch (DomainException $exception) {
            $this->errorMessage = $exception->getMessage();

            return;
        }

        session()->flash('status', 'Inspection returned to the inspector.');
        $this->redirectRoute('reports.show', ['inspectnum' => $this->inspectnum], navigate: true);
    }

    public function render(): View
    {
        $inspection = app(InspectionRepository::class)->find($this->inspectnum);

        abort_if($inspection === null, 404);

        $user = auth()->user();
        $status = InspectionStatus::normalize($inspection->inspectstatus);
        $ownerId = $inspection->inspectbyid;
        $isOwner = $ownerId !== null && $user !== null && (int) $ownerId === (int) $user->userid;
        $isChecker = $user?->isChecker() ?? false;

        return view('livewire.inspections.inspection-workflow', [
            'inspection' => $inspection,
            'status' => $status,
            'canSubmit' => InspectionStatus::isEditable($status) && ($isOwner || $isChecker),
            'canEdit' => InspectionStatus::isEditable($status) && ($isOwner || $isChecker),
            'canCheck' => $isChecker && $status === InspectionStatus::SUBMITTED,
        ]);
    }
}
