<div class="vendors-page">
    <x-ui.page-header
        eyebrow="Master Data"
        title="Vendors"
        description="Supplier master data for incoming inspections, including CSV import."
    >
        <x-slot:actions>
            @if ($canManage)
                <x-ui.button variant="secondary" icon="upload" wire:click="openImport">Import CSV</x-ui.button>
                <x-ui.button variant="primary" icon="plus" wire:click="openCreate">Add vendor</x-ui.button>
            @else
                <x-ui.badge variant="neutral">View only</x-ui.badge>
            @endif
        </x-slot:actions>
    </x-ui.page-header>

    @if ($statusMessage)
        <x-ui.alert variant="success">{{ $statusMessage }}</x-ui.alert>
    @endif

    @if ($errorMessage)
        <x-ui.alert variant="error">{{ $errorMessage }}</x-ui.alert>
    @endif

    <div class="card vendors-panel">
        <div class="vendors-toolbar">
            <x-ui.search
                wire:model.live.debounce.300ms="search"
                placeholder="Search vendor account or name..."
                label="Search vendors"
            />

            <span class="vendors-count">
                {{ number_format($vendors->total()) }} vendor{{ $vendors->total() === 1 ? '' : 's' }}
            </span>
        </div>

        @if ($vendors->isEmpty())
            <div class="vendors-empty">
                <x-ui.empty-state
                    icon="building"
                    title="No vendors found"
                    description="Try another account or name, or add the first vendor."
                >
                    @if ($search !== '')
                        <x-slot:actions>
                            <x-ui.button variant="secondary" icon="rotate-ccw" wire:click="resetSearch">Clear search</x-ui.button>
                        </x-slot:actions>
                    @endif
                </x-ui.empty-state>
            </div>
        @else
            <div class="vendors-table-wrap">
                <table class="items-table vendors-table">
                    <thead>
                        <tr>
                            <th>Vendor account</th>
                            <th>Vendor name</th>
                            <th>Inspections</th>
                            @if ($canManage)
                                <th class="vendors-actions-head">Actions</th>
                            @endif
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($vendors as $vendor)
                            <tr wire:key="vendor-{{ $vendor->vendaccount }}">
                                <td><span class="vendor-account mono">{{ $vendor->vendaccount }}</span></td>
                                <td><span class="vendor-name">{{ $vendor->name ?: '—' }}</span></td>
                                <td>
                                    @if ((int) $vendor->inspection_count > 0)
                                        <x-ui.badge variant="info">{{ number_format($vendor->inspection_count) }}</x-ui.badge>
                                    @else
                                        <span class="vendor-muted">—</span>
                                    @endif
                                </td>
                                @if ($canManage)
                                    <td>
                                        <div class="vendor-row-actions">
                                            <x-ui.icon-button
                                                icon="pencil"
                                                :label="'Edit '.$vendor->vendaccount"
                                                wire:click="openEdit({{ \Illuminate\Support\Js::from($vendor->vendaccount) }})"
                                            />

                                            <x-ui.icon-button
                                                icon="trash-2"
                                                variant="danger"
                                                :label="(int) $vendor->inspection_count > 0
                                                    ? 'Cannot delete '.$vendor->vendaccount.': used by inspections'
                                                    : 'Delete '.$vendor->vendaccount"
                                                :disabled="(int) $vendor->inspection_count > 0"
                                                wire:click="confirmDelete({{ \Illuminate\Support\Js::from($vendor->vendaccount) }})"
                                            />
                                        </div>
                                    </td>
                                @endif
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>

            <div class="vendors-footer">
                <span class="vendors-count">
                    Showing {{ $vendors->firstItem() }}-{{ $vendors->lastItem() }} of
                    {{ number_format($vendors->total()) }} vendors
                </span>

                <x-ui.pagination :paginator="$vendors" />
            </div>
        @endif
    </div>

    @if ($showCreate)
        <x-ui.modal
            title="Add vendor"
            subtitle="Create a supplier account for inspections."
            close="closeCreate"
        >
            <form wire:submit="createVendor" class="form">
                <x-ui.field
                    label="Vendor account"
                    for="vendor-account"
                    name="account"
                    hint="Unique account, up to 30 characters. This cannot be changed later."
                >
                    <input
                        id="vendor-account"
                        class="input mono"
                        type="text"
                        wire:model="account"
                        maxlength="30"
                        autocomplete="off"
                        autofocus
                    >
                </x-ui.field>

                <x-ui.field label="Vendor name" for="vendor-name" name="name">
                    <input
                        id="vendor-name"
                        class="input"
                        type="text"
                        wire:model="name"
                        maxlength="100"
                        autocomplete="off"
                    >
                </x-ui.field>

                <div class="modal-foot">
                    <x-ui.button variant="secondary" type="button" icon="x" wire:click="closeCreate">Cancel</x-ui.button>
                    <x-ui.button variant="primary" type="submit" icon="plus" wire:loading.attr="disabled">Create vendor</x-ui.button>
                </div>
            </form>
        </x-ui.modal>
    @endif

    @if ($showEdit)
        <x-ui.modal
            title="Edit vendor"
            :subtitle="'Account '.$editingAccount.' is permanent.'"
            close="closeEdit"
        >
            <form wire:submit="saveEdit" class="form">
                <x-ui.field label="Vendor account" for="edit-vendor-account">
                    <input id="edit-vendor-account" class="input mono" type="text" value="{{ $editingAccount }}" disabled>
                </x-ui.field>

                <x-ui.field label="Vendor name" for="edit-vendor-name" name="name">
                    <input
                        id="edit-vendor-name"
                        class="input"
                        type="text"
                        wire:model="name"
                        maxlength="100"
                        autofocus
                    >
                </x-ui.field>

                <div class="modal-foot">
                    <x-ui.button variant="secondary" type="button" icon="x" wire:click="closeEdit">Cancel</x-ui.button>
                    <x-ui.button variant="primary" type="submit" icon="save" wire:loading.attr="disabled">Save changes</x-ui.button>
                </div>
            </form>
        </x-ui.modal>
    @endif

    @if ($showDelete)
        <x-ui.confirm
            title="Delete vendor"
            close="closeDelete"
            confirm="deleteVendor"
            confirm-label="Delete"
            confirm-icon="trash-2"
            variant="danger"
        >
            <p>
                Delete <strong>{{ $deleteName ?: $deleteAccount }}</strong>
                (<span class="mono">{{ $deleteAccount }}</span>)? This cannot be undone.
            </p>
            @error('deleteVendor')
                <p class="field-error">{{ $message }}</p>
            @enderror
        </x-ui.confirm>
    @endif

    @if ($showImport)
        <x-ui.modal
            title="Import vendors"
            subtitle="CSV columns: vendaccount, name. Header is optional."
            close="closeImport"
        >
            <form wire:submit="importVendors" class="form">
                <x-ui.field label="CSV file" for="vendor-csv" name="csvFile" hint="CSV or TXT, maximum 2 MB.">
                    <input
                        id="vendor-csv"
                        class="input vendor-file-input"
                        type="file"
                        wire:model="csvFile"
                        accept=".csv,text/csv,text/plain"
                    >
                </x-ui.field>

                @if ($csvFile)
                    <p class="vendor-import-file">
                        <x-icon name="file-up" :size="16" />
                        {{ $csvFile->getClientOriginalName() }}
                    </p>
                @endif

                @if ($importErrors !== [])
                    <x-ui.alert variant="error">
                        <ul>
                            @foreach ($importErrors as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </x-ui.alert>
                @elseif ($importParsed)
                    <x-ui.alert variant="success">
                        {{ count($importRows) }} vendor{{ count($importRows) === 1 ? '' : 's' }}
                        ready to import.
                    </x-ui.alert>
                @endif

                @if ($importParsed && $importErrors === [] && $importRows !== [])
                    <div class="vendor-import-preview">
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>Vendor account</th>
                                    <th>Vendor name</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach (array_slice($importRows, 0, 8) as $row)
                                    <tr wire:key="import-{{ $row['vendaccount'] }}">
                                        <td class="mono">{{ $row['vendaccount'] }}</td>
                                        <td>{{ $row['name'] }}</td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                        @if (count($importRows) > 8)
                            <p class="vendor-import-more">
                                +{{ count($importRows) - 8 }} more row{{ count($importRows) - 8 === 1 ? '' : 's' }}
                            </p>
                        @endif
                    </div>
                @endif

                @error('csvFile')
                    <p class="field-error">{{ $message }}</p>
                @enderror

                <div class="modal-foot">
                    <x-ui.button variant="secondary" type="button" icon="x" wire:click="closeImport">Cancel</x-ui.button>
                    <x-ui.button
                        variant="primary"
                        type="submit"
                        icon="upload"
                        wire:loading.attr="disabled"
                        :disabled="$importErrors !== [] || $importRows === []"
                    >
                        Import vendors
                    </x-ui.button>
                </div>
            </form>
        </x-ui.modal>
    @endif
</div>
