<?php

declare(strict_types=1);

namespace App\Livewire\Inspections;

use App\Domain\Inspection\InspectionStatus;
use App\Repositories\AqlPlanRepository;
use App\Repositories\InspectionRepository;
use App\Repositories\ItemRepository;
use App\Services\InspectionCalculator;
use App\Services\InspectionService;
use DomainException;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Livewire\Component;

class InspectionForm extends Component
{
    public string $inspectnum = '';

    public bool $editing = false;

    public string $itemid = '';

    public string $accountnum = '';

    public ?int $planid = null;

    public ?string $openSelect = null;

    public bool $showPlanAdmin = false;

    public string $instrument = '';

    public string $qfnum = '';

    /** @var array<int, array<string, mixed>> */
    public array $deliveries = [];

    /** @var list<array<string, mixed>> */
    public array $stdLines = [];

    /** @var list<array<string, mixed>> */
    public array $otherLines = [];

    /** @var array<int, array<string, mixed>> */
    public array $aql = [];

    public function mount(?string $inspectnum = null): void
    {
        if ($inspectnum !== null && $inspectnum !== '') {
            $this->loadInspection($inspectnum);

            return;
        }

        $plan = app(AqlPlanRepository::class)->defaultPlan();
        $this->planid = $plan?->planid !== null ? (int) $plan->planid : null;

        foreach (range(1, 7) as $column) {
            $this->deliveries[$column] = [
                'po' => '',
                'date' => '',
                'qty' => '',
                'category' => '',
                'notgood' => '0',
                'judgment' => '0',
                'note' => '',
            ];
        }
    }

    public function updatedItemid(): void
    {
        if ($this->editing) {
            return;
        }

        $this->loadItem();
    }

    public function togglePlanAdmin(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $this->openSelect = null;
        $this->showPlanAdmin = ! $this->showPlanAdmin;
    }

    public function closePlanAdmin(): void
    {
        $this->showPlanAdmin = false;
    }

    public function toggleSelect(string $select): void
    {
        $validHeader = in_array($select, ['item', 'supplier', 'plan'], true);
        $validTable = preg_match('/^(category|judgment):[1-7]$/', $select) === 1
            || preg_match('/^status:\d+:[1-7]$/', $select) === 1;

        if (! $validHeader && ! $validTable) {
            return;
        }

        $this->openSelect = $this->openSelect === $select ? null : $select;
    }

    public function selectItem(string $value): void
    {
        if ($this->editing) {
            return;
        }

        $this->openSelect = null;
        $this->itemid = $value;
        $this->resetValidation(['itemid']);
        $this->loadItem();
    }

    public function selectSupplier(string $value): void
    {
        if ($this->editing) {
            return;
        }

        $this->openSelect = null;
        $this->accountnum = $value;
        $this->resetValidation(['accountnum']);
    }

    public function selectPlan(string $value): void
    {
        if ($this->editing) {
            return;
        }

        $this->openSelect = null;
        $this->planid = (int) $value;
        $this->resetValidation(['planid']);
        $this->recalculateAql();
    }

    public function selectCategory(string $value, int $column): void
    {
        if ($column < 1 || $column > 7 || ! in_array($value, ['', '0', '1', '2', '3'], true)) {
            return;
        }

        $this->deliveries[$column]['category'] = $value;
        $this->openSelect = null;
        $this->resetValidation(["deliveries.{$column}.category"]);
        $this->recalculateAql();
    }

    public function selectJudgment(string $value, int $column): void
    {
        if ($column < 1 || $column > 7 || ! in_array($value, ['0', '1', '2', '3'], true)) {
            return;
        }

        $this->deliveries[$column]['judgment'] = $value;
        $this->openSelect = null;
        $this->resetValidation(["deliveries.{$column}.judgment"]);
    }

    public function selectOtherStatus(string $value, int $index, int $column): void
    {
        if (! isset($this->otherLines[$index]) || $column < 1 || $column > 7 || ! in_array($value, ['', '0', '1'], true)) {
            return;
        }

        $this->otherLines[$index]['statuses'][$column] = $value;
        $this->openSelect = null;
        $this->resetValidation(["otherLines.{$index}.statuses.{$column}"]);
    }

    public function updatedPlanid(): void
    {
        $this->recalculateAql();
    }

    public function updatedDeliveries(mixed $value, ?string $key = null): void
    {
        if ($key === null || str_ends_with($key, '.qty') || str_ends_with($key, '.category')) {
            $this->recalculateAql();
        }
    }

    public function save(): void
    {
        $this->errorMessage = '';

        $this->validate([
            'itemid' => ['required', 'string', 'exists:inventtable,itemid'],
            'accountnum' => ['required', 'string', 'exists:vendtable,vendaccount'],
            'planid' => ['required', 'integer', 'exists:aqlplan,planid'],
            'instrument' => ['nullable', 'string', 'max:100'],
            'qfnum' => ['nullable', 'string', 'max:50'],
        ]);

        $used = 0;
        $statuses = $this->standardStatuses();

        foreach (range(1, 7) as $column) {
            $delivery = $this->deliveries[$column] ?? [];
            $qty = (int) round((float) ($delivery['qty'] ?? 0));
            $categoryRaw = $delivery['category'] ?? '';

            if ($qty <= 0) {
                continue;
            }

            $used++;

            if (! is_numeric($delivery['qty'] ?? null)) {
                $this->addError("deliveries.{$column}.qty", 'Enter a numeric received quantity.');
            }

            if ($categoryRaw === '' || ! in_array((int) $categoryRaw, [0, 1, 2, 3], true)) {
                $this->addError("deliveries.{$column}.category", 'Choose an inspection category.');

                continue;
            }

            if (mb_strlen((string) ($delivery['po'] ?? '')) > 30) {
                $this->addError("deliveries.{$column}.po", 'P/O No. must be 30 characters or fewer.');
            }

            if (mb_strlen((string) ($delivery['note'] ?? '')) > 255) {
                $this->addError("deliveries.{$column}.note", 'The note must be 255 characters or fewer.');
            }

            if (filled($delivery['date'] ?? null) && ! Carbon::hasFormat((string) $delivery['date'], 'Y-m-d')) {
                $this->addError("deliveries.{$column}.date", 'Enter a valid delivery date.');
            }

            $category = (int) $categoryRaw;
            $row = $this->aql[$column] ?? null;

            if ($row === null) {
                $this->addError("deliveries.{$column}.qty", 'No AQL row matches this quantity and category.');

                continue;
            }

            $notgood = (int) ($delivery['notgood'] ?? 0);

            if ($notgood > (int) $row['samplesize']) {
                $this->addError("deliveries.{$column}.notgood", 'NG pieces cannot exceed the sample size.');
            }

            $judgment = (int) ($delivery['judgment'] ?? 0);

            if ($judgment === 0) {
                $this->addError("deliveries.{$column}.judgment", 'Choose a judgment for this delivery.');
            }

            if ($judgment === 1 && $notgood > (int) $row['acceptnum']) {
                $this->addError("deliveries.{$column}.judgment", 'Accepted is not allowed when NG exceeds Ac.');
            }

            if ($judgment === 3 && ($notgood < (int) $row['rejectnum'] || ! filled($delivery['note'] ?? null))) {
                $this->addError("deliveries.{$column}.judgment", 'Concession requires at least Re defects and a note.');
            }

            $hasNg = collect($statuses)->contains(fn (array $line): bool => ($line[$column] ?? null) === 0)
                || collect($this->otherLines)->contains(fn (array $line): bool => (string) ($line['statuses'][$column] ?? '') === '0');

            if ($hasNg && $notgood < 1) {
                $this->addError("deliveries.{$column}.notgood", 'Enter at least one defective piece when a dimension is NG.');
            }
        }

        if ($used === 0) {
            $this->addError('deliveries.1.qty', 'Enter at least one delivery quantity.');
        }

        foreach ($this->stdLines as $index => $line) {
            foreach (range(1, 7) as $column) {
                $actual = $line['actuals'][$column] ?? '';

                if ($actual !== '' && ! is_numeric($actual)) {
                    $this->addError("stdLines.{$index}.actuals.{$column}", 'Enter a numeric actual value.');
                }
            }
        }

        foreach ($this->otherLines as $index => $line) {
            foreach (range(1, 7) as $column) {
                $actual = trim((string) ($line['actuals'][$column] ?? ''));

                if (mb_strlen($actual) > 100) {
                    $this->addError("otherLines.{$index}.actuals.{$column}", 'The result must be 100 characters or fewer.');
                }

                $status = (string) ($line['statuses'][$column] ?? '');

                if (! in_array($status, ['', '0', '1'], true)) {
                    $this->addError("otherLines.{$index}.statuses.{$column}", 'Choose OK or NG.');
                }
            }
        }

        if ($this->getErrorBag()->isNotEmpty()) {
            return;
        }

        $payload = [
            'itemid' => $this->itemid,
            'accountnum' => $this->accountnum,
            'instrument' => $this->instrument,
            'qfnum' => $this->qfnum,
            'planid' => (int) $this->planid,
            'deliveries' => $this->deliveries,
            'std' => $this->stdLines,
            'other' => $this->otherLines,
        ];

        try {
            if ($this->editing) {
                $inspectnum = app(InspectionService::class)->update(
                    $this->inspectnum,
                    $payload,
                    auth()->user(),
                );
            } else {
                $inspectnum = app(InspectionService::class)->create($payload, auth()->user());
            }
        } catch (DomainException $exception) {
            $this->addError('general', $exception->getMessage());

            return;
        }

        session()->flash(
            'status',
            $this->editing
                ? 'Inspection '.$inspectnum.' updated.'
                : 'Inspection '.$inspectnum.' saved as draft.',
        );
        $this->redirectRoute('reports.show', ['inspectnum' => $inspectnum], navigate: true);
    }

    public function render(): View
    {
        $items = DB::table('inventtable')->orderBy('itemid')->pluck('name', 'itemid')->all();
        $vendors = DB::table('vendtable')->orderBy('name')->pluck('name', 'vendaccount')->all();
        $plans = app(AqlPlanRepository::class)->plans();
        $statuses = $this->standardStatuses();
        $suggested = [];
        $itemOptions = [];
        $vendorOptions = [];
        $planOptions = [];

        foreach ($items as $id => $name) {
            $itemOptions[] = [
                'value' => (string) $id,
                'code' => (string) $id,
                'label' => (string) $name,
            ];
        }

        foreach ($vendors as $id => $name) {
            $vendorOptions[] = [
                'value' => (string) $id,
                'code' => (string) $id,
                'label' => (string) $name,
            ];
        }

        foreach ($plans as $plan) {
            $level = trim((string) $plan->inspectlevel);

            $planOptions[] = [
                'value' => (string) $plan->planid,
                'code' => $level !== '' ? $level : null,
                'label' => (string) $plan->name,
                'meta' => (string) $plan->aql,
                'tag' => $plan->isdefault ? 'Default' : null,
            ];
        }

        $categoryTones = [];
        $judgmentTones = [];
        $otherTones = [];
        $categoryOptions = [
            ['value' => '', 'label' => '—', 'meta' => 'Not selected'],
            ['value' => '1', 'code' => 'N', 'label' => 'Normal'],
            ['value' => '2', 'code' => 'R', 'label' => 'Reduce'],
            ['value' => '3', 'code' => 'T', 'label' => 'Tightening'],
            ['value' => '0', 'code' => '100%', 'label' => 'Full inspection'],
        ];
        $judgmentOptions = [
            ['value' => '0', 'label' => '—', 'meta' => 'Not judged'],
            ['value' => '1', 'code' => 'O', 'label' => 'Accepted'],
            ['value' => '2', 'code' => 'X', 'label' => 'Rejected'],
            ['value' => '3', 'code' => 'C', 'label' => 'Concession'],
        ];
        $statusOptions = [
            ['value' => '', 'label' => '—', 'meta' => 'Not checked'],
            ['value' => '1', 'code' => '✓', 'label' => 'OK'],
            ['value' => '0', 'code' => '✕', 'label' => 'NG'],
        ];

        foreach (range(1, 7) as $column) {
            $categoryTones[$column] = match ((string) ($this->deliveries[$column]['category'] ?? '')) {
                '1' => 'info',
                '2', '3' => 'warn',
                '0' => 'ng',
                default => null,
            };

            $judgmentTones[$column] = match ((string) ($this->deliveries[$column]['judgment'] ?? '0')) {
                '1' => 'ok',
                '2' => 'ng',
                '3' => 'warn',
                default => null,
            };

            $row = $this->aql[$column] ?? null;

            if ($row !== null) {
                $suggested[$column] = app(InspectionCalculator::class)->suggestedJudgment(
                    (int) ($this->deliveries[$column]['notgood'] ?? 0),
                    (int) $row['acceptnum'],
                    (int) $row['rejectnum'],
                );
            }
        }

        foreach ($this->otherLines as $index => $line) {
            foreach (range(1, 7) as $column) {
                $otherTones[$index][$column] = match ((string) ($line['statuses'][$column] ?? '')) {
                    '1' => 'ok',
                    '0' => 'ng',
                    default => null,
                };
            }
        }

        return view('livewire.inspections.inspection-form', [
            'itemOptions' => $itemOptions,
            'vendorOptions' => $vendorOptions,
            'planOptions' => $planOptions,
            'standardStatuses' => $statuses,
            'suggested' => $suggested,
            'categoryTones' => $categoryTones,
            'judgmentTones' => $judgmentTones,
            'otherTones' => $otherTones,
            'categoryOptions' => $categoryOptions,
            'judgmentOptions' => $judgmentOptions,
            'statusOptions' => $statusOptions,
        ]);
    }

    private function loadInspection(string $inspectnum): void
    {
        $repository = app(InspectionRepository::class);
        $inspection = $repository->find($inspectnum);

        abort_if($inspection === null, 404);

        $status = InspectionStatus::normalize($inspection->inspectstatus);

        abort_unless(
            InspectionStatus::isEditable($status),
            403,
            'Only draft or returned inspections can be edited.',
        );

        $user = auth()->user();

        abort_if($user === null, 403);
        abort_if(
            ! $user->isChecker()
                && $inspection->inspectbyid !== null
                && (int) $inspection->inspectbyid !== (int) $user->userid,
            403,
            'You cannot edit this inspection.',
        );

        $this->inspectnum = $inspectnum;
        $this->editing = true;
        $this->itemid = (string) ($inspection->itemid ?? '');
        $this->accountnum = (string) ($inspection->accountnum ?? '');
        $this->planid = $inspection->aqlplanid !== null
            ? (int) $inspection->aqlplanid
            : app(AqlPlanRepository::class)->defaultPlan()?->planid;
        $this->instrument = (string) ($inspection->instrument ?? '');
        $this->qfnum = (string) ($inspection->qfnum ?? '');

        foreach (range(1, 7) as $column) {
            $qty = $inspection->{'qty_received'.$column};
            $category = $inspection->{'inspectcategory'.$column};
            $date = $inspection->{'deliverydate'.$column};

            $this->deliveries[$column] = [
                'po' => (string) ($inspection->{'purchordernum'.$column} ?? ''),
                'date' => filled($date)
                    ? Carbon::parse($date)->format('Y-m-d')
                    : '',
                'qty' => $qty !== null && (float) $qty > 0
                    ? rtrim(rtrim(number_format((float) $qty, 2, '.', ''), '0'), '.')
                    : '',
                'category' => $qty !== null && (float) $qty > 0 ? (string) (int) $category : '',
                'notgood' => (string) (int) ($inspection->{'notgood'.$column} ?? 0),
                'judgment' => (string) (int) ($inspection->{'judgment'.$column} ?? 0),
                'note' => (string) ($inspection->{'concessionnote'.$column} ?? ''),
            ];
        }

        $this->stdLines = [];

        foreach ($repository->lines($inspectnum) as $line) {
            $actuals = [];

            foreach (range(1, 7) as $column) {
                $actuals[$column] = $line->{'actual_'.$column} ?? '';
            }

            $this->stdLines[] = [
                'inspecttype' => 'STD',
                'inspectitem' => trim((string) ($line->inspectitem ?? '')),
                'standard_txt' => trim((string) ($line->standard_txt ?? '')),
                'standard' => $line->standard,
                'tolerance' => trim((string) ($line->tolerance_txt ?? '')),
                'tolerance_plus' => $line->tolerance_plus ?? 0,
                'tolerance_minus' => $line->tolerance_minus ?? 0,
                'actuals' => $actuals,
            ];
        }

        $this->otherLines = [];

        foreach ($repository->otherLines($inspectnum) as $line) {
            $actuals = [];
            $statuses = [];

            foreach (range(1, 7) as $column) {
                $actuals[$column] = (string) ($line->{'actual_txt_'.$column} ?? '');
                $statuses[$column] = $line->{'status_'.$column} === null
                    ? ''
                    : (string) (int) $line->{'status_'.$column};
            }

            $this->otherLines[] = [
                'inspecttype' => trim((string) ($line->inspecttype ?? '')),
                'inspectitem' => trim((string) ($line->inspectitem ?? '')),
                'standard_txt' => trim((string) ($line->standard_txt ?? '')),
                'actuals' => $actuals,
                'statuses' => $statuses,
            ];
        }

        $this->recalculateAql();
    }

    private function loadItem(): void
    {
        $this->stdLines = [];
        $this->otherLines = [];
        $this->aql = [];

        if ($this->itemid === '') {
            return;
        }

        $standards = app(ItemRepository::class)->standardsFor($this->itemid);

        foreach ($standards as $standard) {
            $type = strtoupper(trim((string) $standard->inspecttype));

            if ($type === 'STD') {
                $this->stdLines[] = [
                    'inspecttype' => 'STD',
                    'inspectitem' => trim((string) $standard->inspectitem),
                    'standard_txt' => trim((string) $standard->standard_txt),
                    'standard' => $standard->standard,
                    'tolerance' => trim((string) $standard->tolerance),
                    'tolerance_plus' => $standard->tolerance_plus ?? 0,
                    'tolerance_minus' => $standard->tolerance_minus ?? 0,
                    'actuals' => array_fill(1, 7, ''),
                ];

                continue;
            }

            if (in_array($type, ['CERTIFIKAT', 'VISUAL', 'FITTING'], true)) {
                $this->otherLines[] = [
                    'inspecttype' => $type,
                    'inspectitem' => trim((string) $standard->inspectitem),
                    'standard_txt' => trim((string) $standard->standard_txt),
                    'actuals' => array_fill(1, 7, ''),
                    'statuses' => array_fill(1, 7, ''),
                ];
            }
        }

        $this->recalculateAql();
    }

    private function recalculateAql(): void
    {
        $this->aql = [];

        if ($this->planid === null) {
            return;
        }

        $repository = app(AqlPlanRepository::class);

        foreach (range(1, 7) as $column) {
            $delivery = $this->deliveries[$column] ?? [];
            $qty = (int) round((float) ($delivery['qty'] ?? 0));
            $categoryRaw = $delivery['category'] ?? '';

            if ($qty <= 0 || $categoryRaw === '') {
                continue;
            }

            $category = (int) $categoryRaw;
            $row = $repository->rowFor((int) $this->planid, $category, $qty);

            if ($row === null) {
                continue;
            }

            $this->aql[$column] = [
                'codeletter' => $row->codeletter,
                'samplesize' => (int) $row->samplesize,
                'acceptnum' => (int) $row->acceptnum,
                'rejectnum' => (int) $row->rejectnum,
            ];
        }
    }

    /**
     * @return array<int, array<int, int|null>>
     */
    private function standardStatuses(): array
    {
        $calculator = app(InspectionCalculator::class);
        $statuses = [];

        foreach ($this->stdLines as $index => $line) {
            foreach (range(1, 7) as $column) {
                $statuses[$index][$column] = $calculator->standardStatus(
                    $line['actuals'][$column] ?? null,
                    $line['standard'] ?? null,
                    $line['tolerance_plus'] ?? 0,
                    $line['tolerance_minus'] ?? 0,
                );
            }
        }

        return $statuses;
    }
}
