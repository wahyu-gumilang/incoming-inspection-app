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

    <x-ui.page-header
        eyebrow="Administration"
        title="User Management"
        description="Accounts and roles. Only administrators can manage users."
    >
        <x-slot:actions>
            <x-ui.button variant="primary" icon="plus" wire:click="openCreate">Add user</x-ui.button>
        </x-slot:actions>
    </x-ui.page-header>

    @if (session('temporary_password'))
        <div class="temp-password" role="status">
            <div>
                <strong>Temporary password for {{ session('temporary_username') }}</strong>
                <p>Share it with the user. They must change it at first sign-in. It is shown only once.</p>
            </div>
            <div class="temp-password-value">
                <code>{{ session('temporary_password') }}</code>
                <x-ui.button variant="secondary" size="sm" type="button" data-copy-password>Copy</x-ui.button>
            </div>
        </div>
    @endif

    @if ($statusMessage)
        <x-ui.alert variant="success">{{ $statusMessage }}</x-ui.alert>
    @endif

    <div class="card users-panel">
        <div class="users-toolbar">
            <x-ui.search
                wire:model.live.debounce.300ms="search"
                placeholder="Search name, username or email..."
                label="Search users"
            />

            <div class="users-filters">
                <x-ui.dropdown
                    :label="$roleOptions[$role] ?? 'All roles'"
                    :value="$role"
                    :options="$roleOptions"
                    :tones="$roleTones"
                    :open="$openRole"
                    toggle="toggleRole"
                    select="selectRole"
                />

                <x-ui.dropdown
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
                                        <span class="user-cell-meta">
                                            <span class="user-cell-username">{{ $user->username }}</span>
                                            @if ($user->userid === $currentUserId)
                                                <x-ui.badge variant="solid" size="sm">You</x-ui.badge>
                                            @endif
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td class="{{ $user->email ? '' : 'cell-muted' }}">{{ $user->email ?: 'Not set' }}</td>
                            <td><x-ui.role-badge :role="$user->role" /></td>
                            <td><x-ui.status-badge :active="$user->active" /></td>
                            <td class="cell-muted">
                                {{ $user->last_login_at?->timezone('Asia/Jakarta')->format('jS M Y, H:i') ?? 'Never' }}
                            </td>
                            <td>
                                <div class="row-actions">
                                    <x-ui.icon-button
                                        icon="pencil"
                                        label="Edit {{ $user->fullname }}"
                                        wire:click="openEdit({{ $user->userid }})"
                                    />

                                    @if ($user->userid !== $currentUserId)
                                        <x-ui.icon-button
                                            icon="key"
                                            label="Reset password for {{ $user->fullname }}"
                                            wire:click="confirmReset({{ $user->userid }})"
                                        />

                                        <x-ui.icon-button
                                            :icon="$user->active ? 'user-x' : 'user-check'"
                                            :variant="$user->active ? 'danger' : 'success'"
                                            :label="($user->active ? 'Deactivate' : 'Activate').' '.$user->fullname"
                                            wire:click="confirmToggle({{ $user->userid }})"
                                        />
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

            <x-ui.pagination :paginator="$users" />
        </div>
    </div>

    @if ($showCreate)
        <x-ui.modal
            title="Add user"
            subtitle="The user signs in with a temporary password and must change it."
            close="closeCreate"
        >
            <form wire:submit="createUser" class="form">
                <x-ui.field label="Full name" for="create-fullname" name="fullname">
                    <input id="create-fullname" class="input" type="text" wire:model="fullname" maxlength="50" autofocus>
                </x-ui.field>

                <x-ui.field label="Username" for="create-username" name="username" hint="3-50 letters, digits, dots, dashes or underscores.">
                    <input id="create-username" class="input mono" type="text" wire:model="username" maxlength="50" autocomplete="off">
                </x-ui.field>

                <x-ui.field label="Email" for="create-email" name="email">
                    <input id="create-email" class="input" type="email" wire:model="email" maxlength="100" placeholder="Optional">
                </x-ui.field>

                <x-ui.field label="Role" for="create-role" name="formRole">
                    <x-ui.dropdown
                        id="create-role"
                        class="ui-dropdown-full"
                        :label="\App\Domain\User\Role::label($formRole)"
                        :value="$formRole"
                        :options="$formRoleOptions"
                        :tones="$roleTones"
                        :open="$openFormRole"
                        toggle="toggleFormRole"
                        select="selectFormRole"
                        placement="up"
                    />
                </x-ui.field>

                <div class="modal-foot">
                    <x-ui.button variant="secondary" type="button" wire:click="closeCreate">Cancel</x-ui.button>
                    <x-ui.button variant="primary" type="submit" wire:loading.attr="disabled">Create user</x-ui.button>
                </div>
            </form>
        </x-ui.modal>
    @endif

    @if ($showEdit)
        <x-ui.modal
            :title="'Edit '.$editingUsername"
            subtitle="Update the name, email address and role."
            close="closeEdit"
        >
            <form wire:submit="saveEdit" class="form">
                <x-ui.field label="Username" for="edit-username">
                    <input id="edit-username" class="input mono" type="text" value="{{ $editingUsername }}" disabled>
                </x-ui.field>

                <x-ui.field label="Full name" for="edit-fullname" name="fullname">
                    <input id="edit-fullname" class="input" type="text" wire:model="fullname" maxlength="50" autofocus>
                </x-ui.field>

                <x-ui.field label="Email" for="edit-email" name="email">
                    <input id="edit-email" class="input" type="email" wire:model="email" maxlength="100" placeholder="Optional">
                </x-ui.field>

                <x-ui.field
                    label="Role"
                    for="edit-role"
                    name="formRole"
                    :hint="$editingIsSelf ? 'You cannot change your own role.' : null"
                >
                    <x-ui.dropdown
                        id="edit-role"
                        class="ui-dropdown-full"
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
                </x-ui.field>

                <div class="modal-foot">
                    <x-ui.button variant="secondary" type="button" wire:click="closeEdit">Cancel</x-ui.button>
                    <x-ui.button variant="primary" type="submit" wire:loading.attr="disabled">Save changes</x-ui.button>
                </div>
            </form>
        </x-ui.modal>
    @endif

    @if ($showReset)
        <x-ui.confirm
            title="Reset password"
            close="closeReset"
            confirm="resetPassword"
            confirm-label="Reset password"
            variant="primary"
        >
            <p>
                Reset the password for <strong>{{ $resetName }}</strong>? A new temporary password
                will be generated and shown once.
            </p>
            @error('reset') <p class="field-error">{{ $message }}</p> @enderror
        </x-ui.confirm>
    @endif

    @if ($showToggle)
        <x-ui.confirm
            :title="$toggleToActive ? 'Activate user' : 'Deactivate user'"
            close="closeToggle"
            confirm="toggleActive"
            :confirm-label="$toggleToActive ? 'Activate' : 'Deactivate'"
            :variant="$toggleToActive ? 'success' : 'danger'"
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
        </x-ui.confirm>
    @endif
</div>
