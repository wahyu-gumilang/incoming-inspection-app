<div>
    @php
        $roleOptions = ['' => 'All roles'];
        foreach (\App\Domain\User\Role::all() as $roleOption) {
            $roleOptions[$roleOption] = \App\Domain\User\Role::label($roleOption);
        }
        $formRoleOptions = $roleOptions;
        unset($formRoleOptions['']);
        $statusOptions = ['' => 'All statuses', 'active' => 'Active', 'inactive' => 'Inactive'];
        $roleTones = ['' => 'neutral', \App\Domain\User\Role::INSPECTOR => 'inspector', \App\Domain\User\Role::CHECKER => 'checker', \App\Domain\User\Role::ADMIN => 'admin'];
        $statusTones = ['' => 'neutral', 'active' => 'active', 'inactive' => 'inactive'];
    @endphp

    <div class="page-header">
        <div>
            <span class="page-eyebrow">Administration</span>
            <h1>User Management</h1>
            <p>Accounts and roles. Only administrators can manage users.</p>
        </div>

        <button class="btn btn-primary" type="button" wire:click="openCreate">
            <x-icon name="plus" :size="17" />
            Add user
        </button>
    </div>

    @if (session('temporary_password'))
        <div class="temp-password" role="status">
            <div>
                <strong>Temporary password for {{ session('temporary_username') }}</strong>
                <p>Share it with the user. They must change it at first sign-in. It is shown only once.</p>
            </div>
            <div class="temp-password-value">
                <code>{{ session('temporary_password') }}</code>
                <button class="btn btn-sm" type="button" data-copy-password>Copy</button>
            </div>
        </div>
    @endif

    @if ($statusMessage)
        <div class="alert alert-success" role="status">{{ $statusMessage }}</div>
    @endif

    <div class="card users-panel">
        <div class="users-toolbar">
            <div class="users-search">
                <x-icon name="search" :size="18" />
                <input
                    class="input"
                    type="search"
                    wire:model.live.debounce.300ms="search"
                    placeholder="Search name, username or email..."
                    aria-label="Search users"
                >
            </div>

            <div class="users-filters">
                <x-filter-select
                    :label="$roleOptions[$role] ?? 'All roles'"
                    :value="$role"
                    :options="$roleOptions"
                    :tones="$roleTones"
                    :open="$openRole"
                    toggle="toggleRole"
                    select="selectRole"
                />

                <x-filter-select
                    :label="$statusOptions[$status] ?? 'All statuses'"
                    :value="$status"
                    :options="$statusOptions"
                    :tones="$statusTones"
                    :open="$openStatus"
                    toggle="toggleStatus"
                    select="selectStatus"
                />
            </div>
        </div>

        <div class="users-table-wrap">
            <table class="items-table users-table">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last sign-in</th>
                        <th class="actions-head">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($users as $user)
                        <tr wire:key="user-{{ $user->userid }}" class="{{ $user->active ? '' : 'row-inactive' }}">
                            <td>
                                <div class="user-cell">
                                    <x-user-avatar :user="$user" :size="34" />
                                    <div class="user-cell-text">
                                        <strong>{{ $user->fullname }}</strong>
                                        <span>
                                            {{ $user->username }}
                                            @if ($user->userid === $currentUserId)
                                                <span class="you-badge">You</span>
                                            @endif
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td class="{{ $user->email ? '' : 'cell-muted' }}">{{ $user->email ?: 'Not set' }}</td>
                            <td>
                                <span class="role-badge role-{{ strtolower($user->role) }}">{{ $user->roleLabel() }}</span>
                            </td>
                            <td>
                                <span class="status-pill {{ $user->active ? 'is-active' : 'is-inactive' }}">
                                    <span class="status-dot"></span>
                                    {{ $user->active ? 'Active' : 'Inactive' }}
                                </span>
                            </td>
                            <td class="cell-muted">
                                {{ $user->last_login_at?->timezone('Asia/Jakarta')->format('jS M Y, H:i') ?? 'Never' }}
                            </td>
                            <td>
                                <div class="row-actions">
                                    <button
                                        class="icon-btn"
                                        type="button"
                                        wire:click="openEdit({{ $user->userid }})"
                                        title="Edit {{ $user->fullname }}"
                                        aria-label="Edit {{ $user->fullname }}"
                                    >
                                        <x-icon name="pencil" :size="16" />
                                    </button>

                                    @if ($user->userid !== $currentUserId)
                                        <button
                                            class="icon-btn"
                                            type="button"
                                            wire:click="confirmReset({{ $user->userid }})"
                                            title="Reset password for {{ $user->fullname }}"
                                            aria-label="Reset password for {{ $user->fullname }}"
                                        >
                                            <x-icon name="key" :size="16" />
                                        </button>

                                        <button
                                            class="icon-btn {{ $user->active ? 'icon-btn-danger' : 'icon-btn-success' }}"
                                            type="button"
                                            wire:click="confirmToggle({{ $user->userid }})"
                                            title="{{ $user->active ? 'Deactivate' : 'Activate' }} {{ $user->fullname }}"
                                            aria-label="{{ $user->active ? 'Deactivate' : 'Activate' }} {{ $user->fullname }}"
                                        >
                                            <x-icon :name="$user->active ? 'user-x' : 'user-check'" :size="16" />
                                        </button>
                                    @endif
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="empty">No users match these filters.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="users-footer">
            <span class="users-count">
                @if ($users->total() > 0)
                    Showing {{ $users->firstItem() }}-{{ $users->lastItem() }} of {{ $users->total() }} users
                @else
                    No users
                @endif
            </span>

            @if ($users->hasPages())
                <div class="pagination">
                    <button
                        class="page-btn"
                        type="button"
                        wire:click="previousPage"
                        @disabled($users->onFirstPage())
                    >
                        Previous
                    </button>

                    @foreach ($users->getUrlRange(max(1, $users->currentPage() - 1), min($users->lastPage(), $users->currentPage() + 1)) as $page => $url)
                        <button
                            class="page-btn {{ $page === $users->currentPage() ? 'is-active' : '' }}"
                            type="button"
                            wire:click="gotoPage({{ $page }})"
                        >
                            {{ $page }}
                        </button>
                    @endforeach

                    <button
                        class="page-btn"
                        type="button"
                        wire:click="nextPage"
                        @disabled(! $users->hasMorePages())
                    >
                        Next
                    </button>
                </div>
            @endif
        </div>
    </div>

    @if ($showCreate)
        <x-modal
            title="Add user"
            subtitle="The user signs in with a temporary password and must change it."
            close="closeCreate"
        >
            <form wire:submit="createUser" class="form">
                <label class="field">
                    <span class="label">Full name</span>
                    <input class="input" type="text" wire:model="fullname" maxlength="50" autofocus>
                    @error('fullname') <span class="field-error">{{ $message }}</span> @enderror
                </label>

                <label class="field">
                    <span class="label">Username</span>
                    <input class="input mono" type="text" wire:model="username" maxlength="50" autocomplete="off">
                    <span class="field-hint">3-50 letters, digits, dots, dashes or underscores.</span>
                    @error('username') <span class="field-error">{{ $message }}</span> @enderror
                </label>

                <label class="field">
                    <span class="label">Email</span>
                    <input class="input" type="email" wire:model="email" maxlength="100" placeholder="Optional">
                    @error('email') <span class="field-error">{{ $message }}</span> @enderror
                </label>

                <div class="field">
                    <span class="label">Role</span>
                    <div class="form-filter-select">
                        <x-filter-select
                            :label="\App\Domain\User\Role::label($formRole)"
                            :value="$formRole"
                            :options="$formRoleOptions"
                            :tones="$roleTones"
                            :open="$openFormRole"
                            toggle="toggleFormRole"
                            select="selectFormRole"
                            placement="up"
                        />
                    </div>
                    @error('formRole') <span class="field-error">{{ $message }}</span> @enderror
                </div>

                <div class="modal-foot">
                    <button class="btn" type="button" wire:click="closeCreate">Cancel</button>
                    <button class="btn btn-primary" type="submit" wire:loading.attr="disabled">Create user</button>
                </div>
            </form>
        </x-modal>
    @endif

    @if ($showEdit)
        <x-modal
            :title="'Edit '.$editingUsername"
            subtitle="Update the name, email address and role."
            close="closeEdit"
        >
            <form wire:submit="saveEdit" class="form">
                <label class="field">
                    <span class="label">Username</span>
                    <input class="input mono" type="text" value="{{ $editingUsername }}" disabled>
                </label>

                <label class="field">
                    <span class="label">Full name</span>
                    <input class="input" type="text" wire:model="fullname" maxlength="50" autofocus>
                    @error('fullname') <span class="field-error">{{ $message }}</span> @enderror
                </label>

                <label class="field">
                    <span class="label">Email</span>
                    <input class="input" type="email" wire:model="email" maxlength="100" placeholder="Optional">
                    @error('email') <span class="field-error">{{ $message }}</span> @enderror
                </label>

                <div class="field">
                    <span class="label">Role</span>
                    <div class="form-filter-select">
                        <x-filter-select
                            :label="\App\Domain\User\Role::label($formRole)"
                            :value="$formRole"
                            :options="$formRoleOptions"
                            :tones="$roleTones"
                            :open="$openFormRole"
                            toggle="toggleFormRole"
                            select="selectFormRole"
                            placement="up"
                            :disabled="$editingIsSelf"
                        />
                    </div>
                    @if ($editingIsSelf)
                        <span class="field-hint">You cannot change your own role.</span>
                    @endif
                    @error('formRole') <span class="field-error">{{ $message }}</span> @enderror
                </div>

                <div class="modal-foot">
                    <button class="btn" type="button" wire:click="closeEdit">Cancel</button>
                    <button class="btn btn-primary" type="submit" wire:loading.attr="disabled">Save changes</button>
                </div>
            </form>
        </x-modal>
    @endif

    @if ($showReset)
        <x-modal title="Reset password" close="closeReset">
            <p>
                Reset the password for <strong>{{ $resetName }}</strong>? A new temporary password
                will be generated and shown once.
            </p>
            @error('reset') <p class="field-error">{{ $message }}</p> @enderror

            <div class="modal-foot">
                <button class="btn" type="button" wire:click="closeReset">Cancel</button>
                <button class="btn btn-primary" type="button" wire:click="resetPassword" wire:loading.attr="disabled">
                    Reset password
                </button>
            </div>
        </x-modal>
    @endif

    @if ($showToggle)
        <x-modal
            :title="$toggleToActive ? 'Activate user' : 'Deactivate user'"
            close="closeToggle"
        >
            <p>
                {{ $toggleToActive ? 'Activate' : 'Deactivate' }}
                <strong>{{ $toggleName }}</strong>?
                @if ($toggleToActive)
                    The user will be able to sign in again.
                @else
                    The user will be signed out and will not be able to sign in.
                @endif
            </p>
            @error('toggle') <p class="field-error">{{ $message }}</p> @enderror

            <div class="modal-foot">
                <button class="btn" type="button" wire:click="closeToggle">Cancel</button>
                <button class="btn btn-primary" type="button" wire:click="toggleActive" wire:loading.attr="disabled">
                    {{ $toggleToActive ? 'Activate' : 'Deactivate' }}
                </button>
            </div>
        </x-modal>
    @endif
</div>
