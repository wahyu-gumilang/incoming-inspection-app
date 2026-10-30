<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\VendorRepository;
use DomainException;
use Illuminate\Database\QueryException;

class VendorService
{
    public function create(string $account, string $name): void
    {
        $account = trim($account);
        $name = trim($name);

        if (app(VendorRepository::class)->exists($account)) {
            throw new DomainException('That vendor account already exists.');
        }

        try {
            app(VendorRepository::class)->create($account, $name);
        } catch (QueryException $exception) {
            if ((string) $exception->getCode() === '23000') {
                throw new DomainException('That vendor account already exists.', 0, $exception);
            }

            throw $exception;
        }
    }

    public function rename(string $account, string $name): void
    {
        if (! app(VendorRepository::class)->exists($account)) {
            throw new DomainException('The vendor could not be found.');
        }

        app(VendorRepository::class)->rename($account, trim($name));
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
     * @param  list<array{vendaccount: string, name: string}>  $rows
     */
    public function import(array $rows): void
    {
        app(VendorRepository::class)->upsert($rows);
    }
}
