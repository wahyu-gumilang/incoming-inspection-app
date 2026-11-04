<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\VendorRepository;
use DomainException;
use Illuminate\Database\QueryException;

class VendorService
{
    /**
     * @param  array{vendaccount: string, name: string, contact_person?: string|null, phone?: string|null, email?: string|null, address?: string|null, joined_at?: string|null}  $data
     */
    public function create(array $data): void
    {
        $data = $this->normalize($data);
        $account = $data['vendaccount'];

        if (app(VendorRepository::class)->exists($account)) {
            throw new DomainException('That vendor account already exists.');
        }

        try {
            app(VendorRepository::class)->create($data);
        } catch (QueryException $exception) {
            if ((string) $exception->getCode() === '23000') {
                throw new DomainException('That vendor account already exists.', 0, $exception);
            }

            throw $exception;
        }
    }

    /**
     * @param  array{name: string, contact_person?: string|null, phone?: string|null, email?: string|null, address?: string|null, joined_at?: string|null}  $data
     */
    public function update(string $account, array $data): void
    {
        if (! app(VendorRepository::class)->exists($account)) {
            throw new DomainException('The vendor could not be found.');
        }

        app(VendorRepository::class)->update($account, $this->normalize($data));
    }

    public function delete(string $account): void
    {
        $repository = app(VendorRepository::class);

        if ($repository->isUsed($account)) {
            throw new DomainException('This vendor is used by an inspection and cannot be deleted.');
        }

        if ($repository->delete($account) === 0) {
            throw new DomainException('The vendor could not be found.');
        }
    }

    /**
     * @param  list<array{vendaccount: string, name: string, contact_person?: string|null, phone?: string|null, email?: string|null, address?: string|null, joined_at?: string|null}>  $rows
     */
    public function import(array $rows): void
    {
        app(VendorRepository::class)->upsert(array_map(
            fn (array $row): array => $this->normalize($row),
            $rows,
        ));
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalize(array $data): array
    {
        foreach (['vendaccount', 'name', 'contact_person', 'phone', 'email', 'address'] as $field) {
            if (array_key_exists($field, $data)) {
                $data[$field] = filled($data[$field]) ? trim((string) $data[$field]) : null;
            }
        }

        if (array_key_exists('joined_at', $data)) {
            $data['joined_at'] = filled($data['joined_at']) ? (string) $data['joined_at'] : null;
        }

        return $data;
    }
}
