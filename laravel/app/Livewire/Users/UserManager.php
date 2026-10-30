<?php

declare(strict_types=1);

namespace App\Livewire\Users;

use App\Domain\User\Role;
use App\Models\User;
use App\Repositories\UserRepository;
use App\Services\UserService;
use DomainException;
use Illuminate\Contracts\View\View;
use Illuminate\Validation\Rule;
use Livewire\Component;
use Livewire\WithPagination;

class UserManager extends Component
{
    use WithPagination;

    public string $search = '';

    public string $role = '';

    public string $status = '';

    public bool $openRole = false;

    public bool $openStatus = false;

    public bool $openFormRole = false;

    public int $perPage = 15;

    public bool $showCreate = false;

    public bool $showEdit = false;

    public bool $showReset = false;

    public bool $showToggle = false;

    public string $username = '';

    public string $fullname = '';

    public string $email = '';

    public string $formRole = Role::INSPECTOR;

    public ?int $editingId = null;

    public string $editingUsername = '';

    public bool $editingIsSelf = false;

    public ?int $resetId = null;

    public string $resetName = '';

    public ?int $toggleId = null;

    public string $toggleName = '';

    public bool $toggleToActive = true;

    public string $statusMessage = '';

    public function boot(): void
    {
        abort_unless(auth()->user()?->isAdmin(), 403);
    }

    public function updatedSearch(): void
    {
        $this->resetPage();
    }

    public function updatedRole(): void
    {
        $this->resetPage();
    }

    public function updatedStatus(): void
    {
        $this->resetPage();
    }

    public function toggleRole(): void
    {
        $this->openRole = ! $this->openRole;
        $this->openStatus = false;
    }

    public function toggleStatus(): void
    {
        $this->openStatus = ! $this->openStatus;
        $this->openRole = false;
    }

    public function closeFilters(): void
    {
        $this->openRole = false;
        $this->openStatus = false;
    }

    public function selectRole(string $role): void
    {
        if ($role !== '' && ! in_array($role, Role::all(), true)) {
            return;
        }

        $this->role = $role;
        $this->openRole = false;
        $this->resetPage();
    }

    public function selectStatus(string $status): void
    {
        if (! in_array($status, ['', 'active', 'inactive'], true)) {
            return;
        }

        $this->status = $status;
        $this->openStatus = false;
        $this->resetPage();
    }

    public function applyStatFilter(string $stat): void
    {
        if (! in_array($stat, ['all', 'active', 'inactive'], true)) {
            return;
        }

        $this->status = $stat === 'all' ? '' : $stat;
        $this->openRole = false;
        $this->openStatus = false;
        $this->resetPage();
    }

    public function toggleFormRole(): void
    {
        $this->openFormRole = ! $this->openFormRole;
        $this->openRole = false;
        $this->openStatus = false;
    }

    public function selectFormRole(string $role): void
    {
        if (! in_array($role, Role::all(), true)) {
            return;
        }

        $this->formRole = $role;
        $this->openFormRole = false;
    }

    public function openCreate(): void
    {
        $this->resetForm();
        $this->showCreate = true;
        $this->resetValidation();
    }

    public function closeCreate(): void
    {
        $this->showCreate = false;
        $this->openFormRole = false;
        $this->resetValidation();
    }

    public function createUser(): void
    {
        $this->validate();

        try {
            [$user, $password] = app(UserService::class)->create([
                'username' => $this->username,
                'fullname' => $this->fullname,
                'email' => $this->email,
                'role' => $this->formRole,
            ]);
        } catch (DomainException $exception) {
            $this->addError('username', $exception->getMessage());

            return;
        }

        $this->showCreate = false;
        $this->resetForm();
        $this->statusMessage = 'User created. Share the temporary password.';

        session()->now('temporary_password', $password);
        session()->now('temporary_username', $user->username);
    }

    public function openEdit(int $userid): void
    {
        $user = User::findOrFail($userid);

        $this->editingId = $user->userid;
        $this->editingUsername = $user->username;
        $this->editingIsSelf = $user->is(auth()->user());
        $this->fullname = $user->fullname;
        $this->email = $user->email ?? '';
        $this->formRole = $user->role;
        $this->showEdit = true;
        $this->openFormRole = false;
        $this->resetValidation();
    }

    public function closeEdit(): void
    {
        $this->showEdit = false;
        $this->openFormRole = false;
        $this->resetValidation();
    }

    public function saveEdit(): void
    {
        $this->validate();

        $user = User::findOrFail($this->editingId);

        try {
            app(UserService::class)->update($user, [
                'fullname' => $this->fullname,
                'email' => $this->email,
                'role' => $this->formRole,
            ], auth()->user());
        } catch (DomainException $exception) {
            $this->addError('formRole', $exception->getMessage());

            return;
        }

        $this->showEdit = false;
        $this->openFormRole = false;
        $this->statusMessage = 'User updated.';
        $this->resetValidation();
    }

    public function confirmReset(int $userid): void
    {
        $user = User::findOrFail($userid);

        $this->resetId = $user->userid;
        $this->resetName = $user->fullname;
        $this->showReset = true;
        $this->resetValidation();
    }

    public function closeReset(): void
    {
        $this->showReset = false;
        $this->resetValidation();
    }

    public function resetPassword(): void
    {
        $user = User::findOrFail($this->resetId);

        try {
            $password = app(UserService::class)->resetPassword($user, auth()->user());
        } catch (DomainException $exception) {
            $this->addError('reset', $exception->getMessage());

            return;
        }

        $this->showReset = false;
        $this->statusMessage = 'Password reset. Share the temporary password.';
        $this->resetValidation();

        session()->now('temporary_password', $password);
        session()->now('temporary_username', $user->username);
    }

    public function confirmToggle(int $userid): void
    {
        $user = User::findOrFail($userid);

        $this->toggleId = $user->userid;
        $this->toggleName = $user->fullname;
        $this->toggleToActive = ! $user->active;
        $this->showToggle = true;
        $this->resetValidation();
    }

    public function closeToggle(): void
    {
        $this->showToggle = false;
        $this->resetValidation();
    }

    public function toggleActive(): void
    {
        $user = User::findOrFail($this->toggleId);

        try {
            app(UserService::class)->setActive($user, $this->toggleToActive, auth()->user());
        } catch (DomainException $exception) {
            $this->addError('toggle', $exception->getMessage());

            return;
        }

        $this->showToggle = false;
        $this->statusMessage = $user->active ? 'User activated.' : 'User deactivated.';
        $this->resetValidation();
    }

    public function render(): View
    {
        $repository = app(UserRepository::class);

        return view('livewire.users.user-manager', [
            'users' => $repository->paginate(
                $this->search,
                $this->role,
                $this->status,
                $this->perPage,
            ),
            'stats' => $repository->stats(),
            'activeStat' => $this->activeStat(),
            'currentUserId' => auth()->id(),
        ]);
    }

    private function activeStat(): ?string
    {
        return match ($this->status) {
            '' => 'all',
            'active' => 'active',
            'inactive' => 'inactive',
            default => null,
        };
    }

    /**
     * @return array<string, mixed>
     */
    protected function rules(): array
    {
        if ($this->showCreate) {
            return [
                'username' => [
                    'required',
                    'string',
                    'min:3',
                    'max:50',
                    'regex:/^[A-Za-z0-9._-]+$/',
                    'unique:usertable,username',
                ],
                'fullname' => ['required', 'string', 'max:50'],
                'email' => ['nullable', 'email', 'max:100'],
                'formRole' => ['required', Rule::in(Role::all())],
            ];
        }

        if ($this->showEdit) {
            return [
                'fullname' => ['required', 'string', 'max:50'],
                'email' => ['nullable', 'email', 'max:100'],
                'formRole' => ['required', Rule::in(Role::all())],
            ];
        }

        return [];
    }

    private function resetForm(): void
    {
        $this->username = '';
        $this->fullname = '';
        $this->email = '';
        $this->formRole = Role::INSPECTOR;
        $this->editingId = null;
        $this->editingUsername = '';
        $this->editingIsSelf = false;
        $this->openFormRole = false;
        $this->resetValidation();
    }
}
