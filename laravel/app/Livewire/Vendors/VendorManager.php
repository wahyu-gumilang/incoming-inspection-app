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

    public string $contactPerson = '';

    public string $phone = '';

    public string $email = '';

    public string $address = '';

    public string $joinedAt = '';

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

        $this->normalizeForm();

        $this->validate([
            'account' => ['required', 'string', 'max:30', 'unique:vendtable,vendaccount'],
            'name' => ['required', 'string', 'max:100'],
            'contactPerson' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:100'],
            'address' => ['nullable', 'string', 'max:255'],
            'joinedAt' => ['nullable', 'date'],
        ]);

        try {
            app(VendorService::class)->create($this->vendorData());
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
        $this->contactPerson = trim((string) ($vendor->contact_person ?? ''));
        $this->phone = trim((string) ($vendor->phone ?? ''));
        $this->email = trim((string) ($vendor->email ?? ''));
        $this->address = trim((string) ($vendor->address ?? ''));
        $this->joinedAt = $vendor->joined_at ? (string) $vendor->joined_at : '';
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

        $this->normalizeForm();

        $this->validate([
            'name' => ['required', 'string', 'max:100'],
            'contactPerson' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:100'],
            'address' => ['nullable', 'string', 'max:255'],
            'joinedAt' => ['nullable', 'date'],
        ]);

        try {
            app(VendorService::class)->update($this->editingAccount, $this->vendorData(false));
        } catch (DomainException $exception) {
            $this->addError('name', $exception->getMessage());

            return;
        }

        $this->showEdit = false;
        $this->statusMessage = 'Vendor updated.';
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
            $contactPerson = trim((string) ($fields[2] ?? ''));
            $phone = trim((string) ($fields[3] ?? ''));
            $email = trim((string) ($fields[4] ?? ''));
            $address = trim((string) ($fields[5] ?? ''));
            $joinedAt = trim((string) ($fields[6] ?? ''));

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

            if (mb_strlen($contactPerson) > 100) {
                $this->importErrors[] = 'Line '.$lineNumber.': contact person must be 100 characters or fewer.';

                continue;
            }

            if (mb_strlen($phone) > 30) {
                $this->importErrors[] = 'Line '.$lineNumber.': phone must be 30 characters or fewer.';

                continue;
            }

            if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                $this->importErrors[] = 'Line '.$lineNumber.': email is not valid.';

                continue;
            }

            if (mb_strlen($address) > 255) {
                $this->importErrors[] = 'Line '.$lineNumber.': address must be 255 characters or fewer.';

                continue;
            }

            if ($joinedAt !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $joinedAt) !== 1) {
                $this->importErrors[] = 'Line '.$lineNumber.': joined date must use YYYY-MM-DD.';

                continue;
            }

            if ($joinedAt !== '') {
                [$year, $month, $day] = array_map('intval', explode('-', $joinedAt));

                if (! checkdate($month, $day, $year)) {
                    $this->importErrors[] = 'Line '.$lineNumber.': joined date is not valid.';

                    continue;
                }
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
                'contact_person' => $contactPerson !== '' ? $contactPerson : null,
                'phone' => $phone !== '' ? $phone : null,
                'email' => $email !== '' ? $email : null,
                'address' => $address !== '' ? $address : null,
                'joined_at' => $joinedAt !== '' ? $joinedAt : null,
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

    private function normalizeForm(): void
    {
        $this->account = trim($this->account);
        $this->name = trim($this->name);
        $this->contactPerson = trim($this->contactPerson);
        $this->phone = trim($this->phone);
        $this->email = trim($this->email);
        $this->address = trim($this->address);
        $this->joinedAt = trim($this->joinedAt);
    }

    /**
     * @return array<string, string|null>
     */
    private function vendorData(bool $includeAccount = true): array
    {
        $data = [
            'name' => $this->name,
            'contact_person' => $this->contactPerson !== '' ? $this->contactPerson : null,
            'phone' => $this->phone !== '' ? $this->phone : null,
            'email' => $this->email !== '' ? $this->email : null,
            'address' => $this->address !== '' ? $this->address : null,
            'joined_at' => $this->joinedAt !== '' ? $this->joinedAt : null,
        ];

        if ($includeAccount) {
            $data = ['vendaccount' => $this->account] + $data;
        }

        return $data;
    }

    private function resetForm(): void
    {
        $this->account = '';
        $this->name = '';
        $this->contactPerson = '';
        $this->phone = '';
        $this->email = '';
        $this->address = '';
        $this->joinedAt = '';
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
