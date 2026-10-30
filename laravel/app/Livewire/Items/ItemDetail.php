<?php

declare(strict_types=1);

namespace App\Livewire\Items;

use App\Repositories\ItemRepository;
use App\Services\ItemService;
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
