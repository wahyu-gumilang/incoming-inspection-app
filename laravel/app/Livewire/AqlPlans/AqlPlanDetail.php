<?php

declare(strict_types=1);

namespace App\Livewire\AqlPlans;

use App\Repositories\AqlPlanRepository;
use App\Services\AqlPlanService;
use DomainException;
use Illuminate\Contracts\View\View;
use Illuminate\Validation\Rule;
use Livewire\Component;

class AqlPlanDetail extends Component
{
    private const CATEGORY_META = [
        1 => ['label' => 'Normal', 'class' => 'is-normal'],
        2 => ['label' => 'Reduced', 'class' => 'is-reduced'],
        3 => ['label' => 'Tightened', 'class' => 'is-tightened'],
    ];

    public int $planid;

    public string $statusMessage = '';

    public string $errorMessage = '';

    public bool $showEditPlan = false;

    public string $name = '';

    public string $inspectlevel = '';

    public string $aql = '';

    public string $note = '';

    public bool $makeDefault = false;

    public bool $editingIsDefault = false;

    public bool $showRow = false;

    public bool $editingRow = false;

    public int $rowCategory = 1;

    public string $rowLotmin = '';

    public string $rowLotmax = '';

    public string $rowCodeletter = '';

    public string $rowSamplesize = '';

    public string $rowAcceptnum = '0';

    public string $rowRejectnum = '1';

    public ?int $originalCategory = null;

    public ?int $originalLotmin = null;

    public bool $showDeleteRow = false;

    public int $deleteRowCategory = 0;

    public int $deleteRowLotmin = 0;

    public string $deleteRowLabel = '';

    public bool $showDeletePlan = false;

    public string $deletePlanName = '';

    public function mount(int $planid): void
    {
        $this->planid = $planid;

        abort_if(app(AqlPlanRepository::class)->find($planid) === null, 404);
    }

    public function openEditPlan(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $plan = app(AqlPlanRepository::class)->find($this->planid);

        abort_if($plan === null, 404);

        $this->name = (string) $plan->name;
        $this->inspectlevel = (string) $plan->inspectlevel;
        $this->aql = (string) $plan->aql;
        $this->note = (string) ($plan->note ?? '');
        $this->makeDefault = false;
        $this->editingIsDefault = (int) $plan->isdefault === 1;
        $this->showEditPlan = true;
        $this->showRow = false;
        $this->showDeleteRow = false;
        $this->showDeletePlan = false;
        $this->resetValidation();
    }

    public function closeEditPlan(): void
    {
        $this->showEditPlan = false;
        $this->resetValidation();
    }

    public function savePlan(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $this->name = trim($this->name);
        $this->inspectlevel = trim($this->inspectlevel);
        $this->aql = trim($this->aql);
        $this->note = trim($this->note);

        $this->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('aqlplan', 'name')->ignore($this->planid, 'planid'),
            ],
            'inspectlevel' => ['required', 'string', 'max:10'],
            'aql' => ['required', 'string', 'max:20'],
            'note' => ['nullable', 'string', 'max:255'],
            'makeDefault' => ['boolean'],
        ]);

        try {
            app(AqlPlanService::class)->updatePlan($this->planid, [
                'name' => $this->name,
                'inspectlevel' => $this->inspectlevel,
                'aql' => $this->aql,
                'note' => $this->note,
            ], $this->makeDefault);
        } catch (DomainException $exception) {
            $this->addError('name', $exception->getMessage());

            return;
        }

        $this->showEditPlan = false;
        $this->statusMessage = 'AQL plan updated.';
        $this->errorMessage = '';
        $this->resetValidation();
    }

    public function setDefault(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        try {
            app(AqlPlanService::class)->setDefault($this->planid);
        } catch (DomainException $exception) {
            $this->errorMessage = $exception->getMessage();

            return;
        }

        $this->statusMessage = 'Default AQL plan updated.';
        $this->errorMessage = '';
    }

    public function openCreateRow(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $this->resetRowForm();
        $this->rowCategory = 1;
        $this->editingRow = false;
        $this->showRow = true;
        $this->showEditPlan = false;
        $this->showDeleteRow = false;
        $this->showDeletePlan = false;
        $this->resetValidation();
    }

    public function openEditRow(int $category, int $lotmin): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $row = app(AqlPlanRepository::class)->findRow($this->planid, $category, $lotmin);

        abort_if($row === null, 404);

        $this->resetRowForm();
        $this->originalCategory = $category;
        $this->originalLotmin = $lotmin;
        $this->rowCategory = (int) $row->inspectcategory;
        $this->rowLotmin = (string) $row->lotmin;
        $this->rowLotmax = $row->lotmax === null ? '' : (string) $row->lotmax;
        $this->rowCodeletter = (string) $row->codeletter;
        $this->rowSamplesize = (string) $row->samplesize;
        $this->rowAcceptnum = (string) $row->acceptnum;
        $this->rowRejectnum = (string) $row->rejectnum;
        $this->editingRow = true;
        $this->showRow = true;
        $this->showEditPlan = false;
        $this->showDeleteRow = false;
        $this->showDeletePlan = false;
        $this->resetValidation();
    }

    public function closeRow(): void
    {
        $this->showRow = false;
        $this->resetRowForm();
    }

    public function saveRow(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $this->rowLotmin = trim($this->rowLotmin);
        $this->rowLotmax = trim($this->rowLotmax);
        $this->rowCodeletter = strtoupper(trim($this->rowCodeletter));
        $this->rowSamplesize = trim($this->rowSamplesize);
        $this->rowAcceptnum = trim($this->rowAcceptnum);
        $this->rowRejectnum = trim($this->rowRejectnum);

        $this->validate([
            'rowCategory' => ['required', 'integer', 'in:1,2,3'],
            'rowLotmin' => ['required', 'integer', 'min:1'],
            'rowLotmax' => ['nullable', 'integer', 'min:1', 'gte:rowLotmin'],
            'rowCodeletter' => ['required', 'string', 'max:2'],
            'rowSamplesize' => ['required', 'integer', 'min:1'],
            'rowAcceptnum' => ['required', 'integer', 'min:0'],
            'rowRejectnum' => ['required', 'integer', 'min:1', 'gt:rowAcceptnum'],
        ]);

        $data = [
            'inspectcategory' => $this->rowCategory,
            'lotmin' => (int) $this->rowLotmin,
            'lotmax' => $this->rowLotmax !== '' ? (int) $this->rowLotmax : null,
            'codeletter' => $this->rowCodeletter,
            'samplesize' => (int) $this->rowSamplesize,
            'acceptnum' => (int) $this->rowAcceptnum,
            'rejectnum' => (int) $this->rowRejectnum,
        ];

        try {
            if ($this->editingRow && $this->originalCategory !== null && $this->originalLotmin !== null) {
                app(AqlPlanService::class)->updateRow(
                    $this->planid,
                    $this->originalCategory,
                    $this->originalLotmin,
                    $data,
                );
            } else {
                app(AqlPlanService::class)->createRow($this->planid, $data);
            }
        } catch (DomainException $exception) {
            $this->addError('rowLotmin', $exception->getMessage());

            return;
        }

        $this->showRow = false;
        $this->statusMessage = $this->editingRow ? 'AQL row updated.' : 'AQL row added.';
        $this->errorMessage = '';
        $this->resetRowForm();
    }

    public function confirmDeleteRow(int $category, int $lotmin): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $row = app(AqlPlanRepository::class)->findRow($this->planid, $category, $lotmin);

        abort_if($row === null, 404);

        $this->deleteRowCategory = $category;
        $this->deleteRowLotmin = $lotmin;
        $this->deleteRowLabel = $row->lotmin.'-'.($row->lotmax ?? 'no upper limit');
        $this->showDeleteRow = true;
        $this->showRow = false;
        $this->showEditPlan = false;
        $this->showDeletePlan = false;
        $this->resetValidation();
    }

    public function closeDeleteRow(): void
    {
        $this->showDeleteRow = false;
        $this->resetValidation();
    }

    public function deleteRow(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        try {
            app(AqlPlanService::class)->deleteRow($this->planid, $this->deleteRowCategory, $this->deleteRowLotmin);
        } catch (DomainException $exception) {
            $this->addError('deleteRow', $exception->getMessage());

            return;
        }

        $this->showDeleteRow = false;
        $this->statusMessage = 'AQL row deleted.';
        $this->errorMessage = '';
        $this->resetValidation();
    }

    public function confirmDeletePlan(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $repository = app(AqlPlanRepository::class);
        $plan = $repository->find($this->planid);

        abort_if($plan === null, 404);

        if ($repository->planCount() <= 1) {
            $this->errorMessage = 'At least one AQL plan is required.';

            return;
        }

        if ((int) $plan->inspection_count > 0) {
            $this->errorMessage = 'This AQL plan is used by an inspection and cannot be deleted.';

            return;
        }

        $this->deletePlanName = (string) $plan->name;
        $this->showDeletePlan = true;
        $this->showRow = false;
        $this->showEditPlan = false;
        $this->showDeleteRow = false;
        $this->resetValidation();
    }

    public function closeDeletePlan(): void
    {
        $this->showDeletePlan = false;
        $this->resetValidation();
    }

    public function backToPlans(): void
    {
        $this->dispatch('aql-plan-close');
    }

    public function deletePlan(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        try {
            app(AqlPlanService::class)->deletePlan($this->planid);
        } catch (DomainException $exception) {
            $this->addError('deletePlan', $exception->getMessage());

            return;
        }

        $this->dispatch('aql-plan-close');
        $this->dispatch('aql-plan-deleted');
        $this->skipRender();
    }

    public function render(): View
    {
        $repository = app(AqlPlanRepository::class);
        $plan = $repository->find($this->planid);

        abort_if($plan === null, 404);

        return view('livewire.aql-plans.aql-plan-detail', [
            'plan' => $plan,
            'rows' => $repository->rowsFor($this->planid),
            'categories' => self::CATEGORY_META,
            'planCount' => $repository->planCount(),
            'canManage' => auth()->user()?->isChecker() ?? false,
        ]);
    }

    private function resetRowForm(): void
    {
        $this->rowCategory = 1;
        $this->rowLotmin = '';
        $this->rowLotmax = '';
        $this->rowCodeletter = '';
        $this->rowSamplesize = '';
        $this->rowAcceptnum = '0';
        $this->rowRejectnum = '1';
        $this->originalCategory = null;
        $this->originalLotmin = null;
        $this->editingRow = false;
        $this->showDeleteRow = false;
        $this->deleteRowCategory = 0;
        $this->deleteRowLotmin = 0;
        $this->deleteRowLabel = '';
        $this->resetValidation();
    }
}
