<?php

declare(strict_types=1);

namespace App\Livewire\Vendors;

use App\Repositories\VendorRepository;
use App\Services\VendorService;
use DomainException;
use Illuminate\Contracts\View\View;
use Livewire\Component;
use Livewire\WithFileUploads;
use Livewire\WithPagination;
use Throwable;

class VendorManager extends Component
{
    use WithFileUploads;
    use WithPagination;

    public string $search = '';

    public int $perPage = 20;

    public bool $showCreate = false;

    public bool $showEdit = false;

    public bool $showDelete = false;

    public bool $showImport = false;

    public string $account = '';

    public string $name = '';

    public string $editingAccount = '';

    public string $deleteAccount = '';

    public string $deleteName = '';

    public string $statusMessage = '';

    public string $errorMessage = '';

    public $csvFile = null;

    public array $importRows = [];

    public array $importErrors = [];

    public bool $importParsed = false;

    public function updatedSearch(): void
    {
        $this->resetPage();
    }

    public function resetSearch(): void
    {
        $this->search = '';
        $this->resetPage();
    }

    public function openCreate(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $this->resetForm();
        $this->showCreate = true;
        $this->showEdit = false;
        $this->showDelete = false;
        $this->showImport = false;
        $this->resetValidation();
    }

    public function closeCreate(): void
    {
        $this->showCreate = false;
        $this->resetValidation();
    }

    public function createVendor(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $this->account = trim($this->account);
        $this->name = trim($this->name);

        $this->validate([
            'account' => ['required', 'string', 'max:30', 'unique:vendtable,vendaccount'],
            'name' => ['required', 'string', 'max:100'],
        ]);

        try {
            app(VendorService::class)->create($this->account, $this->name);
        } catch (DomainException $exception) {
            $this->addError('account', $exception->getMessage());

            return;
        }

        $this->showCreate = false;
        $this->statusMessage = 'Vendor added.';
        $this->errorMessage = '';
        $this->resetForm();
        $this->resetPage();
    }

    public function openEdit(string $account): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $vendor = app(VendorRepository::class)->find($account);

        abort_if($vendor === null, 404);

        $this->resetForm();
        $this->account = $vendor->vendaccount;
        $this->editingAccount = $vendor->vendaccount;
        $this->name = trim((string) $vendor->name);
        $this->showEdit = true;
        $this->showCreate = false;
        $this->showDelete = false;
        $this->showImport = false;
        $this->resetValidation();
    }

    public function closeEdit(): void
    {
        $this->showEdit = false;
        $this->resetValidation();
    }

    public function saveEdit(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $this->name = trim($this->name);

        $this->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        try {
            app(VendorService::class)->rename($this->editingAccount, $this->name);
        } catch (DomainException $exception) {
            $this->addError('name', $exception->getMessage());

            return;
        }

        $this->showEdit = false;
        $this->statusMessage = 'Vendor name updated.';
        $this->errorMessage = '';
        $this->resetForm();
    }

    public function confirmDelete(string $account): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $vendor = app(VendorRepository::class)->find($account);

        abort_if($vendor === null, 404);

        if ((int) $vendor->inspection_count > 0) {
            $this->errorMessage = 'This vendor is used by an inspection and cannot be deleted.';

            return;
        }

        $this->deleteAccount = $vendor->vendaccount;
        $this->deleteName = trim((string) $vendor->name);
        $this->showDelete = true;
        $this->showCreate = false;
        $this->showEdit = false;
        $this->showImport = false;
        $this->errorMessage = '';
        $this->resetValidation();
    }

    public function closeDelete(): void
    {
        $this->showDelete = false;
        $this->resetValidation();
    }

    public function deleteVendor(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        try {
            app(VendorService::class)->delete($this->deleteAccount);
        } catch (DomainException $exception) {
            $this->addError('deleteVendor', $exception->getMessage());

            return;
        }

        $this->showDelete = false;
        $this->statusMessage = 'Vendor deleted.';
        $this->errorMessage = '';
        $this->resetValidation();
    }

    public function openImport(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        $this->resetImport();
        $this->showImport = true;
        $this->showCreate = false;
        $this->showEdit = false;
        $this->showDelete = false;
        $this->resetValidation();
    }

    public function closeImport(): void
    {
        $this->showImport = false;
        $this->resetImport();
    }

    public function updatedCsvFile(): void
    {
        $this->validate([
            'csvFile' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
        ]);

        $this->parseCsv();
    }

    public function importVendors(): void
    {
        abort_unless(auth()->user()?->isChecker(), 403);

        if ($this->importErrors !== [] || $this->importRows === []) {
            $this->addError('csvFile', 'Fix the CSV errors before importing.');

            return;
        }

        try {
            app(VendorService::class)->import($this->importRows);
        } catch (Throwable $exception) {
            report($exception);
            $this->addError('csvFile', 'The CSV could not be imported.');

            return;
        }

        $count = count($this->importRows);
        $this->showImport = false;
        $this->statusMessage = $count.' vendor'.($count === 1 ? '' : 's').' imported or updated.';
        $this->errorMessage = '';
        $this->resetImport();
        $this->resetPage();
    }

    public function render(): View
    {
        return view('livewire.vendors.vendor-manager', [
            'vendors' => app(VendorRepository::class)->paginate($this->search, $this->perPage),
            'canManage' => auth()->user()?->isChecker() ?? false,
        ]);
    }

    private function parseCsv(): void
    {
        $this->importRows = [];
        $this->importErrors = [];
        $this->importParsed = false;

        if ($this->csvFile === null) {
            return;
        }

        $path = $this->csvFile->getRealPath();
        $contents = $path !== false ? file_get_contents($path) : false;

        if ($contents === false || trim($contents) === '') {
            $this->importErrors = ['The CSV file is empty.'];
            $this->importParsed = true;

            return;
        }

        $contents = preg_replace('/^\xEF\xBB\xBF/', '', $contents) ?? $contents;
        $lines = preg_split('/\r\n|\n|\r/', $contents) ?: [];
        $firstLine = (string) ($lines[0] ?? '');
        $delimiter = substr_count($firstLine, ';') > substr_count($firstLine, ',') ? ';' : ',';
        $seen = [];

        foreach ($lines as $index => $line) {
            $lineNumber = $index + 1;

            if (trim($line) === '') {
                continue;
            }

            $fields = str_getcsv($line, $delimiter);
            $account = trim((string) ($fields[0] ?? ''));
            $name = trim((string) ($fields[1] ?? ''));

            if ($index === 0 && $this->isHeader($account, $name)) {
                continue;
            }

            if ($account === '' && $name === '') {
                continue;
            }

            if ($account === '') {
                $this->importErrors[] = 'Line '.$lineNumber.': vendor account is required.';

                continue;
            }

            if (mb_strlen($account) > 30) {
                $this->importErrors[] = 'Line '.$lineNumber.': vendor account must be 30 characters or fewer.';

                continue;
            }

            if ($name === '') {
                $this->importErrors[] = 'Line '.$lineNumber.': vendor name is required.';

                continue;
            }

            if (mb_strlen($name) > 100) {
                $this->importErrors[] = 'Line '.$lineNumber.': vendor name must be 100 characters or fewer.';

                continue;
            }

            $key = strtolower($account);

            if (isset($seen[$key])) {
                $this->importErrors[] = 'Line '.$lineNumber.': duplicate vendor account in the CSV.';

                continue;
            }

            $seen[$key] = true;
            $this->importRows[] = [
                'vendaccount' => $account,
                'name' => $name,
            ];
        }

        if ($this->importRows === [] && $this->importErrors === []) {
            $this->importErrors[] = 'No vendor rows were found in the CSV.';
        }

        $this->importParsed = true;
    }

    private function isHeader(string $account, string $name): bool
    {
        $account = strtolower($account);
        $name = strtolower($name);

        return in_array($account, ['vendaccount', 'vendor account', 'account', 'kode vendor'], true)
            || in_array($name, ['name', 'vendor name', 'nama vendor'], true);
    }

    private function resetForm(): void
    {
        $this->account = '';
        $this->name = '';
        $this->editingAccount = '';
        $this->deleteAccount = '';
        $this->deleteName = '';
        $this->resetValidation();
    }

    private function resetImport(): void
    {
        $this->csvFile = null;
        $this->importRows = [];
        $this->importErrors = [];
        $this->importParsed = false;
        $this->resetValidation();
    }
}
