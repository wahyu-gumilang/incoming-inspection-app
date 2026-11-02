<?php

declare(strict_types=1);

namespace App\Livewire\AqlPlans;

use App\Repositories\AqlPlanRepository;
use App\Services\AqlPlanService;
use DomainException;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Livewire\Attributes\On;
use Livewire\Component;
use Livewire\WithPagination;

class AqlPlanManager extends Component
{
    use WithPagination;

    public string $search = '';

    public int $perPage = 20;

    public ?int $selectedPlanid = null;

    public bool $showCreate = false;

    public bool $showEdit = false;

    public bool $showDelete = false;

    public string $name = '';

    public string $inspectlevel = '';

    public string $aql = '';

    public string $note = '';

    public bool $makeDefault = false;

    public bool $editingIsDefault = false;

    public ?int $editingPlanid = null;

    public ?int $deletePlanid = null;

    public string $deleteName = '';

    public string $statusMessage = '';

    public string $errorMessage = '';

    public function updatedSearch(): void
    {
        $this->resetPage();
    }

    public function resetSearch(): void
    {
        $this->search = '';
        $this->resetPage();
    }

    public function openPlan(int $planid): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);
        abort_if(app(AqlPlanRepository::class)->find($planid) === null, 404);

        $this->selectedPlanid = $planid;
        $this->showCreate = false;
        $this->showEdit = false;
        $this->showDelete = false;
        $this->resetValidation();
    }

    #[On('aql-plan-close')]
    public function closePlan(): void
    {
        $this->selectedPlanid = null;
        $this->resetValidation();
    }

    #[On('aql-plan-deleted')]
    public function planDeleted(): void
    {
        $this->statusMessage = 'AQL plan deleted.';
        $this->errorMessage = '';
        $this->resetPage();
    }

    public function openCreate(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $this->resetForm();
        $this->makeDefault = ! DB::table('aqlplan')->where('isdefault', 1)->exists();
        $this->showCreate = true;
        $this->showEdit = false;
        $this->showDelete = false;
        $this->resetValidation();
    }

    public function closeCreate(): void
    {
        $this->showCreate = false;
        $this->resetValidation();
    }

    public function createPlan(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $this->name = trim($this->name);
        $this->inspectlevel = trim($this->inspectlevel);
        $this->aql = trim($this->aql);
        $this->note = trim($this->note);

        $this->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('aqlplan', 'name')],
            'inspectlevel' => ['required', 'string', 'max:10'],
            'aql' => ['required', 'string', 'max:20'],
            'note' => ['nullable', 'string', 'max:255'],
            'makeDefault' => ['boolean'],
        ]);

        try {
            app(AqlPlanService::class)->createPlan([
                'name' => $this->name,
                'inspectlevel' => $this->inspectlevel,
                'aql' => $this->aql,
                'note' => $this->note,
                'isdefault' => $this->makeDefault,
            ]);
        } catch (DomainException $exception) {
            $this->addError('name', $exception->getMessage());

            return;
        }

        $this->showCreate = false;
        $this->statusMessage = 'AQL plan created.';
        $this->errorMessage = '';
        $this->resetForm();
        $this->resetPage();
    }

    public function openEdit(int $planid): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $plan = app(AqlPlanRepository::class)->find($planid);

        abort_if($plan === null, 404);

        $this->resetForm();
        $this->editingPlanid = $planid;
        $this->editingIsDefault = (int) $plan->isdefault === 1;
        $this->name = (string) $plan->name;
        $this->inspectlevel = (string) $plan->inspectlevel;
        $this->aql = (string) $plan->aql;
        $this->note = (string) ($plan->note ?? '');
        $this->showEdit = true;
        $this->showCreate = false;
        $this->showDelete = false;
        $this->resetValidation();
    }

    public function closeEdit(): void
    {
        $this->showEdit = false;
        $this->resetValidation();
    }

    public function saveEdit(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        if ($this->editingPlanid === null) {
            return;
        }

        $this->name = trim($this->name);
        $this->inspectlevel = trim($this->inspectlevel);
        $this->aql = trim($this->aql);
        $this->note = trim($this->note);

        $this->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('aqlplan', 'name')->ignore($this->editingPlanid, 'planid'),
            ],
            'inspectlevel' => ['required', 'string', 'max:10'],
            'aql' => ['required', 'string', 'max:20'],
            'note' => ['nullable', 'string', 'max:255'],
            'makeDefault' => ['boolean'],
        ]);

        try {
            app(AqlPlanService::class)->updatePlan($this->editingPlanid, [
                'name' => $this->name,
                'inspectlevel' => $this->inspectlevel,
                'aql' => $this->aql,
                'note' => $this->note,
            ], $this->makeDefault);
        } catch (DomainException $exception) {
            $this->addError('name', $exception->getMessage());

            return;
        }

        $this->showEdit = false;
        $this->statusMessage = 'AQL plan updated.';
        $this->errorMessage = '';
        $this->resetForm();
    }

    public function setDefault(int $planid): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        try {
            app(AqlPlanService::class)->setDefault($planid);
        } catch (DomainException $exception) {
            $this->errorMessage = $exception->getMessage();

            return;
        }

        $this->statusMessage = 'Default AQL plan updated.';
        $this->errorMessage = '';
    }

    public function confirmDelete(int $planid): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $repository = app(AqlPlanRepository::class);
        $plan = $repository->find($planid);

        abort_if($plan === null, 404);

        if ($repository->planCount() <= 1) {
            $this->errorMessage = 'At least one AQL plan is required.';

            return;
        }

        if ((int) $plan->inspection_count > 0) {
            $this->errorMessage = 'This AQL plan is used by an inspection and cannot be deleted.';

            return;
        }

        $this->deletePlanid = $planid;
        $this->deleteName = (string) $plan->name;
        $this->showDelete = true;
        $this->showCreate = false;
        $this->showEdit = false;
        $this->errorMessage = '';
        $this->resetValidation();
    }

    public function closeDelete(): void
    {
        $this->showDelete = false;
        $this->resetValidation();
    }

    public function deletePlan(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        if ($this->deletePlanid === null) {
            return;
        }

        try {
            app(AqlPlanService::class)->deletePlan($this->deletePlanid);
        } catch (DomainException $exception) {
            $this->addError('deletePlan', $exception->getMessage());

            return;
        }

        $this->showDelete = false;
        $this->statusMessage = 'AQL plan deleted.';
        $this->errorMessage = '';
        $this->resetForm();
        $this->resetPage();
    }

    public function render(): View
    {
        $repository = app(AqlPlanRepository::class);

        return view('livewire.aql-plans.aql-plan-manager', [
            'plans' => $repository->paginate($this->search, $this->perPage),
            'totalPlans' => $repository->planCount(),
            'totalRows' => $repository->rowCount(),
            'defaultPlan' => $repository->defaultPlan(),
            'canManage' => auth()->user()?->isChecker() ?? false,
        ]);
    }

    private function resetForm(): void
    {
        $this->name = '';
        $this->inspectlevel = '';
        $this->aql = '';
        $this->note = '';
        $this->makeDefault = false;
        $this->editingIsDefault = false;
        $this->editingPlanid = null;
        $this->deletePlanid = null;
        $this->deleteName = '';
        $this->resetValidation();
    }
}
