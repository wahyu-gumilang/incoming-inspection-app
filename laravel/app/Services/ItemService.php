<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\ItemRepository;
use DomainException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ItemService
{
    public function create(string $itemid, string $name): object
    {
        $itemid = trim($itemid);
        $name = trim($name);

        try {
            DB::table('inventtable')->insert([
                'itemid' => $itemid,
                'name' => $name,
                'inspectqty' => 0,
            ]);
        } catch (QueryException $exception) {
            if ((string) $exception->getCode() === '23000') {
                throw new DomainException('That part number already exists.', 0, $exception);
            }

            throw $exception;
        }

        $item = app(ItemRepository::class)->find($itemid);

        if ($item === null) {
            throw new RuntimeException('The item was created but could not be loaded.');
        }

        return $item;
    }

    public function rename(string $itemid, string $name): void
    {
        DB::table('inventtable')
            ->where('itemid', $itemid)
            ->update(['name' => trim($name)]);
    }
}
