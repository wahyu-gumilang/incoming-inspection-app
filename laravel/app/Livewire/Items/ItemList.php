<?php

declare(strict_types=1);

namespace App\Livewire\Items;

use App\Repositories\ItemRepository;
use App\Services\ItemService;
use DomainException;
use Illuminate\Contracts\View\View;
use Illuminate\Validation\Rule;
use Livewire\Component;
use Livewire\WithPagination;

class ItemList extends Component
{
    use WithPagination;

    public string $search = '';

    public string $standards = 'all';

    public bool $openStandards = false;

    public int $perPage = 20;

    public bool $showCreate = false;

    public string $itemid = '';

    public string $name = '';

    public function mount(string $search = ''): void
    {
        $this->search = trim($search);
    }

    public function updatedSearch(): void
    {
        $this->resetPage();
    }

    public function resetFilters(): void
    {
        $this->search = '';
        $this->standards = 'all';
        $this->openStandards = false;
        $this->resetPage();
    }

    public function toggleStandards(): void
    {
        $this->openStandards = ! $this->openStandards;
    }

    public function selectStandards(string $value): void
    {
        if (! in_array($value, ['all', 'with', 'without'], true)) {
            return;
        }

        $this->standards = $value;
        $this->openStandards = false;
        $this->resetPage();
    }

    public function openCreate(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $this->resetForm();
        $this->showCreate = true;
        $this->resetValidation();
    }

    public function closeCreate(): void
    {
        $this->showCreate = false;
        $this->openStandards = false;
        $this->resetValidation();
    }

    public function createItem(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $this->itemid = trim($this->itemid);
        $this->name = trim($this->name);

        $this->validate([
            'itemid' => [
                'required',
                'string',
                'max:30',
                Rule::unique('inventtable', 'itemid'),
            ],
            'name' => ['required', 'string', 'max:100'],
        ]);

        try {
            $item = app(ItemService::class)->create($this->itemid, $this->name);
        } catch (DomainException $exception) {
            $this->addError('itemid', $exception->getMessage());

            return;
        }

        $this->showCreate = false;
        $this->resetForm();

        session()->flash('status', 'Item '.$item->itemid.' was created.');

        $this->redirectRoute(
            'items.show',
            ['itemid' => $item->itemid],
            navigate: true,
        );
    }

    public function render(): View
    {
        $repository = app(ItemRepository::class);

        return view('livewire.items.item-list', [
            'items' => $repository->paginate($this->search, $this->standards, $this->perPage),
            'stats' => $repository->stats(),
            'canManage' => auth()->user()?->isChecker() ?? false,
            'standardsOptions' => [
                'all' => 'All standards',
                'with' => 'With standards',
                'without' => 'Without standards',
            ],
            'standardsTones' => [
                'all' => 'neutral',
                'with' => 'active',
                'without' => 'inactive',
            ],
        ]);
    }

    private function resetForm(): void
    {
        $this->itemid = '';
        $this->name = '';
        $this->openStandards = false;
        $this->resetValidation();
    }
}
