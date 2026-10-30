<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\ItemRepository;
use DomainException;
use Illuminate\Database\QueryException;

class StandardService
{
    /**
     * @param  array{inspectitem: string, standard_txt: string|null, standard: mixed, tolerance: string|null, tolerance_plus: mixed, tolerance_minus: mixed}  $data
     */
    public function create(string $itemid, string $type, array $data): void
    {
        $repository = app(ItemRepository::class);
        $type = trim($type);
        $inspectitem = trim($data['inspectitem']);
        $item = $repository->find($itemid);

        if ($item === null) {
            throw new DomainException('The item could not be found.');
        }

        if ($repository->standardExists($itemid, $type, $inspectitem)) {
            throw new DomainException('That characteristic already exists for this standard type.');
        }

        try {
            $repository->createStandard([
                'itemid' => $itemid,
                'itemname' => $item->name,
                'inspecttype' => $type,
                'inspectitem' => $inspectitem,
                'standard_txt' => $data['standard_txt'],
                'standard' => $data['standard'],
                'tolerance' => $data['tolerance'],
                'tolerance_plus' => $data['tolerance_plus'],
                'tolerance_minus' => $data['tolerance_minus'],
            ]);
        } catch (QueryException $exception) {
            if ((string) $exception->getCode() === '23000') {
                throw new DomainException('That characteristic already exists for this standard type.', 0, $exception);
            }

            throw $exception;
        }
    }

    /**
     * @param  array{standard_txt: string|null, standard: mixed, tolerance: string|null, tolerance_plus: mixed, tolerance_minus: mixed}  $data
     */
    public function update(string $itemid, string $type, string $inspectitem, array $data): void
    {
        $repository = app(ItemRepository::class);

        if ($repository->findStandard($itemid, $type, $inspectitem) === null) {
            throw new DomainException('The standard could not be found.');
        }

        $repository->updateStandard($itemid, $type, $inspectitem, [
            'standard_txt' => $data['standard_txt'],
            'standard' => $data['standard'],
            'tolerance' => $data['tolerance'],
            'tolerance_plus' => $data['tolerance_plus'],
            'tolerance_minus' => $data['tolerance_minus'],
        ]);
    }

    public function delete(string $itemid, string $type, string $inspectitem): void
    {
        $deleted = app(ItemRepository::class)->deleteStandard($itemid, $type, $inspectitem);

        if ($deleted === 0) {
            throw new DomainException('The standard could not be found.');
        }
    }
}
