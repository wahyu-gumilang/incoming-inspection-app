<?php

namespace App\Livewire\UiKit;

use App\Domain\User\Role;
use Illuminate\Contracts\View\View;
use Illuminate\Pagination\LengthAwarePaginator;
use Livewire\Component;
use Livewire\WithPagination;

class Preview extends Component
{
    use WithPagination;

    public bool $showModal = false;

    public bool $showConfirm = false;

    public bool $openRole = false;

    public bool $openDemoSelect = false;

    public string $role = Role::INSPECTOR;

    public string $demoSelect = '2';

    public ?string $demoMessage = null;

    public function boot(): void
    {
        abort_unless(auth()->user()?->role === Role::ADMIN, 403);
    }

    public function openModal(): void
    {
        $this->showModal = true;
    }

    public function closeModal(): void
    {
        $this->showModal = false;
    }

    public function openConfirm(): void
    {
        $this->showConfirm = true;
    }

    public function closeConfirm(): void
    {
        $this->showConfirm = false;
    }

    public function confirmDemo(): void
    {
        $this->showConfirm = false;
        $this->demoMessage = 'The example action was confirmed.';
    }

    public function toggleRole(): void
    {
        $this->openRole = ! $this->openRole;
    }

    public function selectRole(string $value): void
    {
        if (array_key_exists($value, Role::all())) {
            $this->role = $value;
        }

        $this->openRole = false;
    }

    public function toggleDemoSelect(): void
    {
        $this->openDemoSelect = ! $this->openDemoSelect;
    }

    public function selectDemoSelect(string $value): void
    {
        $this->demoSelect = $value;
        $this->openDemoSelect = false;
    }

    public function render(): View
    {
        $page = $this->getPage();
        $items = range(1, 42);
        $paginator = new LengthAwarePaginator(
            array_slice($items, ($page - 1) * 10, 10),
            42,
            10,
            $page,
            ['path' => request()->url()],
        );

        return view('livewire.ui-kit.preview', [
            'paginator' => $paginator,
            'roleOptions' => Role::all(),
            'demoSelectOptions' => [
                [
                    'value' => '1',
                    'code' => 'S-1',
                    'label' => 'Current practice',
                    'meta' => 'Ac 0',
                    'tag' => 'Default',
                ],
                [
                    'value' => '2',
                    'code' => 'II',
                    'label' => 'ISO General Level II, AQL 2.5',
                    'meta' => '2.5',
                ],
            ],
            'roleTones' => [
                Role::INSPECTOR => 'inspector',
                Role::CHECKER => 'checker',
                Role::ADMIN => 'admin',
            ],
        ]);
    }
}
