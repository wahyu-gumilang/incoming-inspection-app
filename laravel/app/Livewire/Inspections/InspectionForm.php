<?php

declare(strict_types=1);

namespace App\Livewire\Inspections;

use App\Repositories\AqlPlanRepository;
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
    public string $itemid = '';

    public string $accountnum = '';

    public ?int $planid = null;

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

    public function mount(): void
    {
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
        $this->loadItem();
    }

    public function updatedPlanid(): void
    {
        $this->recalculateAql();
    }

    public function updatedDeliveries(mixed $value, string $key): void
    {
        if (str_ends_with($key, '.qty') || str_ends_with($key, '.category')) {
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

        try {
            $inspectnum = app(InspectionService::class)->create([
                'itemid' => $this->itemid,
                'accountnum' => $this->accountnum,
                'instrument' => $this->instrument,
                'qfnum' => $this->qfnum,
                'planid' => (int) $this->planid,
                'deliveries' => $this->deliveries,
                'std' => $this->stdLines,
                'other' => $this->otherLines,
            ], auth()->user());
        } catch (DomainException $exception) {
            $this->addError('general', $exception->getMessage());

            return;
        }

        session()->flash('status', 'Inspection '.$inspectnum.' saved as draft.');
        $this->redirectRoute('reports.show', ['inspectnum' => $inspectnum], navigate: true);
    }

    public function render(): View
    {
        $items = DB::table('inventtable')->orderBy('itemid')->pluck('name', 'itemid')->all();
        $vendors = DB::table('vendtable')->orderBy('name')->pluck('name', 'vendaccount')->all();
        $plans = app(AqlPlanRepository::class)->plans();
        $statuses = $this->standardStatuses();
        $suggested = [];

        foreach (range(1, 7) as $column) {
            $row = $this->aql[$column] ?? null;

            if ($row !== null) {
                $suggested[$column] = app(InspectionCalculator::class)->suggestedJudgment(
                    (int) ($this->deliveries[$column]['notgood'] ?? 0),
                    (int) $row['acceptnum'],
                    (int) $row['rejectnum'],
                );
            }
        }

        return view('livewire.inspections.inspection-form', [
            'items' => $items,
            'vendors' => $vendors,
            'plans' => $plans,
            'standardStatuses' => $statuses,
            'suggested' => $suggested,
        ]);
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
