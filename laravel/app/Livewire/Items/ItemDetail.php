<?php

declare(strict_types=1);

namespace App\Livewire\Items;

use App\Repositories\ItemRepository;
use App\Services\ItemService;
use App\Services\StandardService;
use DomainException;
use Illuminate\Contracts\View\View;
use Livewire\Component;

class ItemDetail extends Component
{
    private const SECTIONS = [
        'STD' => [
            'label' => 'STD',
            'description' => 'Dimensional requirements',
            'empty' => 'No dimensional standards attached yet.',
            'icon' => 'ruler',
            'tone' => 'std',
        ],
        'CERTIFIKAT' => [
            'label' => 'Certificate',
            'description' => 'Certificate requirements',
            'empty' => 'No certificate requirements attached yet.',
            'icon' => 'badge-check',
            'tone' => 'certifikat',
        ],
        'VISUAL' => [
            'label' => 'Visual',
            'description' => 'Visual inspection points',
            'empty' => 'No visual checks attached yet.',
            'icon' => 'eye',
            'tone' => 'visual',
        ],
        'FITTING' => [
            'label' => 'Fitting',
            'description' => 'Fitting and assembly points',
            'empty' => 'No fitting points attached yet.',
            'icon' => 'wrench',
            'tone' => 'fitting',
        ],
    ];

    public string $itemid;

    public string $name = '';

    public bool $showEdit = false;

    public string $statusMessage = '';

    public bool $showStandard = false;

    public bool $editingStandard = false;

    public string $standardType = 'STD';

    public string $standardItem = '';

    public string $standardValue = '';

    public string $standardText = '';

    public string $tolerance = '';

    public string $tolerancePlus = '0';

    public string $toleranceMinus = '0';

    public ?string $originalType = null;

    public ?string $originalItem = null;

    public bool $showDeleteStandard = false;

    public string $deleteStandardType = '';

    public string $deleteStandardItem = '';

    public string $deleteOriginalType = '';

    public string $deleteOriginalItem = '';

    public function mount(string $itemid): void
    {
        $item = app(ItemRepository::class)->find($itemid);

        abort_if($item === null, 404);

        $this->itemid = $itemid;
        $this->name = $item->name;
    }

    public function openEdit(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $item = app(ItemRepository::class)->find($this->itemid);

        abort_if($item === null, 404);

        $this->name = $item->name;
        $this->showEdit = true;
        $this->showStandard = false;
        $this->showDeleteStandard = false;
        $this->resetValidation();
    }

    public function closeEdit(): void
    {
        $this->showEdit = false;
        $this->resetValidation();
    }

    public function save(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $this->name = trim($this->name);

        $this->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        app(ItemService::class)->rename($this->itemid, $this->name);

        $this->showEdit = false;
        $this->statusMessage = 'Item name updated.';
    }

    public function openStandardCreate(string $type): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $type = strtoupper(trim($type));

        if (! array_key_exists($type, self::SECTIONS)) {
            return;
        }

        $this->resetStandardForm();
        $this->standardType = $type;
        $this->editingStandard = false;
        $this->showStandard = true;
        $this->showDeleteStandard = false;
        $this->showEdit = false;
        $this->resetValidation();
    }

    public function openStandardEdit(string $type, string $inspectitem): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $standard = app(ItemRepository::class)->findStandard($this->itemid, $type, $inspectitem);

        abort_if($standard === null, 404);

        $this->resetStandardForm();
        $this->standardType = strtoupper(trim($type));
        $this->originalType = $type;
        $this->originalItem = $inspectitem;
        $this->standardItem = trim((string) $standard->inspectitem);
        $this->standardValue = is_numeric($standard->standard)
            ? number_format((float) $standard->standard, 2, '.', '')
            : '';
        $this->standardText = trim((string) $standard->standard_txt);
        $this->tolerance = trim((string) $standard->tolerance);
        $this->tolerancePlus = number_format((float) $standard->tolerance_plus, 2, '.', '');
        $this->toleranceMinus = number_format((float) $standard->tolerance_minus, 2, '.', '');
        $this->editingStandard = true;
        $this->showStandard = true;
        $this->showDeleteStandard = false;
        $this->showEdit = false;
        $this->resetValidation();
    }

    public function closeStandard(): void
    {
        $this->showStandard = false;
        $this->resetValidation();
    }

    public function saveStandard(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $this->standardItem = trim($this->standardItem);
        $this->standardText = trim($this->standardText);
        $this->standardValue = trim($this->standardValue);
        $this->tolerance = trim($this->tolerance);
        $this->tolerancePlus = trim($this->tolerancePlus);
        $this->toleranceMinus = trim($this->toleranceMinus);

        $this->validate($this->standardRules());

        $isStandard = $this->standardType === 'STD';

        $data = [
            'inspectitem' => $this->standardItem,
            'standard_txt' => $isStandard ? null : $this->standardText,
            'standard' => $isStandard ? $this->standardValue : 0,
            'tolerance' => $this->tolerance !== '' ? $this->tolerance : null,
            'tolerance_plus' => $isStandard ? $this->tolerancePlus : 0,
            'tolerance_minus' => $isStandard ? $this->toleranceMinus : 0,
        ];

        try {
            if ($this->editingStandard) {
                app(StandardService::class)->update(
                    $this->itemid,
                    $this->originalType,
                    $this->originalItem,
                    $data,
                );
            } else {
                app(StandardService::class)->create(
                    $this->itemid,
                    $this->standardType,
                    $data,
                );
            }
        } catch (DomainException $exception) {
            $this->addError('standardItem', $exception->getMessage());

            return;
        }

        $this->showStandard = false;
        $this->statusMessage = $this->editingStandard ? 'Standard updated.' : 'Standard added.';
        $this->resetStandardForm();
    }

    public function confirmStandardDelete(string $type, string $inspectitem): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $standard = app(ItemRepository::class)->findStandard($this->itemid, $type, $inspectitem);

        abort_if($standard === null, 404);

        $this->showStandard = false;
        $this->showEdit = false;
        $this->deleteStandardType = strtoupper(trim($type));
        $this->deleteStandardItem = trim((string) $standard->inspectitem);
        $this->deleteOriginalType = $type;
        $this->deleteOriginalItem = $inspectitem;
        $this->showDeleteStandard = true;
        $this->resetValidation();
    }

    public function closeStandardDelete(): void
    {
        $this->showDeleteStandard = false;
        $this->resetValidation();
    }

    public function deleteStandard(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        try {
            app(StandardService::class)->delete(
                $this->itemid,
                $this->deleteOriginalType,
                $this->deleteOriginalItem,
            );
        } catch (DomainException $exception) {
            $this->addError('standardDelete', $exception->getMessage());

            return;
        }

        $this->showDeleteStandard = false;
        $this->statusMessage = 'Standard deleted.';
        $this->resetValidation();
    }

    /**
     * @return array<string, mixed>
     */
    private function standardRules(): array
    {
        $rules = [
            'standardItem' => ['required', 'string', 'max:100'],
            'standardType' => ['required', 'string', 'max:50'],
            'tolerance' => ['nullable', 'string', 'max:50'],
        ];

        if ($this->standardType === 'STD') {
            $rules['standardValue'] = ['required', 'numeric'];
            $rules['tolerancePlus'] = ['required', 'numeric'];
            $rules['toleranceMinus'] = ['required', 'numeric'];
        } else {
            $rules['standardText'] = ['required', 'string', 'max:100'];
        }

        return $rules;
    }

    private function resetStandardForm(): void
    {
        $this->standardType = 'STD';
        $this->standardItem = '';
        $this->standardValue = '';
        $this->standardText = '';
        $this->tolerance = '';
        $this->tolerancePlus = '0';
        $this->toleranceMinus = '0';
        $this->originalType = null;
        $this->originalItem = null;
        $this->editingStandard = false;
        $this->showDeleteStandard = false;
        $this->deleteStandardType = '';
        $this->deleteStandardItem = '';
        $this->deleteOriginalType = '';
        $this->deleteOriginalItem = '';
        $this->resetValidation();
    }

    public function render(): View
    {

        $repository = app(ItemRepository::class);
        $item = $repository->find($this->itemid);

        abort_if($item === null, 404);

        $standards = $repository->standardsFor($this->itemid);
        $sections = self::SECTIONS;
        $groups = [];

        foreach (array_keys($sections) as $type) {
            $groups[$type] = collect();
        }

        foreach ($standards as $standard) {
            $type = strtoupper(trim((string) $standard->inspecttype));
            $type = $type !== '' ? $type : 'OTHER';

            if (! isset($groups[$type])) {
                $groups[$type] = collect();
                $sections[$type] = [
                    'label' => ucfirst(strtolower($type)),
                    'description' => 'Other inspection requirements',
                    'empty' => 'No other standards attached yet.',
                    'icon' => 'package',
                    'tone' => 'other',
                ];
            }

            $groups[$type]->push($standard);
        }

        return view('livewire.items.item-detail', [
            'item' => $item,
            'sections' => $sections,
            'groups' => $groups,
            'canManage' => auth()->user()?->isChecker() ?? false,
        ]);
    }
}
