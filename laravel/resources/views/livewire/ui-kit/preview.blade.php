<div>
    @if ($demoMessage)
        <x-ui.alert variant="success">{{ $demoMessage }}</x-ui.alert>
    @endif

    <div class="ui-kit-grid">
        <section class="card ui-kit-section">
            <h2>Buttons</h2>
            <p class="ui-kit-note">Primary, secondary, ghost, danger and success actions.</p>

            <div class="ui-kit-row">
                <x-ui.button variant="primary" icon="check">Primary</x-ui.button>
                <x-ui.button icon="settings">Secondary</x-ui.button>
                <x-ui.button variant="ghost" icon="search">Ghost</x-ui.button>
                <x-ui.button variant="danger" icon="trash-2">Delete</x-ui.button>
                <x-ui.button variant="success" icon="check">Approve</x-ui.button>
            </div>

            <div class="ui-kit-row">
                <x-ui.button variant="primary" icon="plus">Add item</x-ui.button>
                <x-ui.button size="sm" icon="download">Export</x-ui.button>
                <x-ui.button variant="primary" href="{{ route('dashboard') }}" icon-after="arrow-up-right">Link button</x-ui.button>
            </div>

            <div class="ui-kit-row">
                <x-ui.icon-button icon="pencil" label="Edit example" />
                <x-ui.icon-button icon="key" label="Reset example" />
                <x-ui.icon-button icon="trash-2" label="Delete example" variant="danger" />
            </div>
        </section>

        <section class="card ui-kit-section">
            <h2>Alerts</h2>
            <p class="ui-kit-note">Feedback for success, errors, warnings and information.</p>

            <div class="ui-kit-stack">
                <x-ui.alert variant="success">The record was saved.</x-ui.alert>
                <x-ui.alert variant="error">Please correct the highlighted fields.</x-ui.alert>
                <x-ui.alert variant="warning">This standard needs Quality confirmation.</x-ui.alert>
                <x-ui.alert variant="info">Inspections are read-only after checking.</x-ui.alert>
            </div>
        </section>

        <section class="card ui-kit-section">
            <h2>Badges and status</h2>
            <p class="ui-kit-note">Roles, active state and small labels.</p>

            <div class="ui-kit-row">
                <x-ui.role-badge role="ADMIN" />
                <x-ui.role-badge role="CHECKER" />
                <x-ui.role-badge role="INSPECTOR" />
                <x-ui.status-badge :active="true" />
                <x-ui.status-badge :active="false" />
            </div>

            <div class="ui-kit-row">
                <x-ui.badge variant="neutral">Neutral</x-ui.badge>
                <x-ui.badge variant="success">Success</x-ui.badge>
                <x-ui.badge variant="warning">Warning</x-ui.badge>
                <x-ui.badge variant="danger">Danger</x-ui.badge>
                <x-ui.badge variant="info">Info</x-ui.badge>
                <x-ui.badge variant="solid" size="sm">You</x-ui.badge>
            </div>
        </section>

        <section class="card ui-kit-section">
            <h2>Stat cards</h2>
            <p class="ui-kit-note">Compact summaries for dashboards and list pages.</p>

            <div class="ui-stat-grid">
                <x-ui.stat tone="blue" icon="users" label="Total users" value="128" note="Accounts in the system" />
                <x-ui.stat tone="green" icon="check" label="Active" value="119" note="Can sign in now" />
                <x-ui.stat tone="orange" icon="shield" label="Admins" value="4" note="Full management access" />
            </div>
        </section>

        <section class="card ui-kit-section">
            <h2>Fields and search</h2>
            <p class="ui-kit-note">Labels, hints, validation messages and the search input.</p>

            <div class="ui-kit-stack">
                <x-ui.field label="Part number" for="kit-part" hint="Use the number printed on the item.">
                    <input id="kit-part" class="input mono" type="text" value="CS-1001">
                </x-ui.field>

                <x-ui.search placeholder="Search components..." label="Search components" />
            </div>
        </section>

        <section class="card ui-kit-section">
            <h2>Dropdown</h2>
            <p class="ui-kit-note">A keyboard-accessible custom select with role tones.</p>

            <x-ui.field label="Role" for="kit-role">
                <x-ui.dropdown
                    id="kit-role"
                    class="ui-dropdown-full"
                    :label="\App\Domain\User\Role::label($role)"
                    :value="$role"
                    :options="$roleOptions"
                    :tones="$roleTones"
                    :open="$openRole"
                    toggle="toggleRole"
                    select="selectRole"
                />
            </x-ui.field>
        </section>

        <section class="card ui-kit-section">
            <h2>Dialog and confirmation</h2>
            <p class="ui-kit-note">Modal forms and destructive-action confirmation.</p>

            <div class="ui-kit-row">
                <x-ui.button variant="primary" icon="maximize-2" wire:click="openModal">Open modal</x-ui.button>
                <x-ui.button variant="danger" icon="alert-triangle" wire:click="openConfirm">Open confirmation</x-ui.button>
            </div>
        </section>

        <section class="card ui-kit-section">
            <h2>Pagination</h2>
            <p class="ui-kit-note">Previous, numbered pages and next. It works with Livewire pagination.</p>

            <div class="ui-kit-pagination">
                <span>Page {{ $paginator->currentPage() }} of {{ $paginator->lastPage() }}</span>
                <x-ui.pagination :paginator="$paginator" />
            </div>
        </section>

        <section class="card ui-kit-section">
            <h2>Empty state</h2>
            <p class="ui-kit-note">A clear next step when a list has no results.</p>

            <x-ui.empty-state
                icon="inbox"
                title="No inspections yet"
                description="Create the first inspection to see it here."
            >
                <x-slot:actions>
                    <x-ui.button variant="primary" icon="plus">Create inspection</x-ui.button>
                </x-slot:actions>
            </x-ui.empty-state>
        </section>
    </div>

    @if ($showModal)
        <x-ui.modal
            title="Example modal"
            subtitle="Use this for forms that need focus."
            close="closeModal"
        >
            <p>Modal content uses the same fields, buttons and spacing as the rest of the app.</p>

            <div class="modal-foot">
                <x-ui.button icon="x" wire:click="closeModal">Cancel</x-ui.button>
                <x-ui.button variant="primary" icon="save" wire:click="closeModal">Save example</x-ui.button>
            </div>
        </x-ui.modal>
    @endif

    @if ($showConfirm)
        <x-ui.confirm
            title="Delete example"
            close="closeConfirm"
            confirm="confirmDemo"
            confirm-label="Delete"
            variant="danger"
        >
            <p>Delete <strong>this example</strong>? This action cannot be undone.</p>
        </x-ui.confirm>
    @endif
</div>
