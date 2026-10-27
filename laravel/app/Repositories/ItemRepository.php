<?php

declare(strict_types=1);

namespace App\Repositories;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ItemRepository
{
    /**
     * Search the legacy item master and count its standards in one query.
     *
     * @return Collection<int, object>
     */
    public function search(?string $term, int $limit = 25): Collection
    {
        $term = trim((string) $term);

        return DB::table('inventtable as item')
            ->select(['item.itemid', 'item.name', 'item.inspectqty'])
            ->selectSub(
                DB::table('inventinspectitem as standard')
                    ->selectRaw('count(*)')
                    ->whereColumn('standard.itemid', 'item.itemid'),
                'standards_count',
            )
            ->when($term !== '', function ($query) use ($term): void {
                $like = '%'.$term.'%';

                $query->where(function ($query) use ($like): void {
                    $query->where('item.itemid', 'like', $like)
                        ->orWhere('item.name', 'like', $like);
                });
            })
            ->orderBy('item.itemid')
            ->limit($limit)
            ->get();
    }

    public function count(): int
    {
        return DB::table('inventtable')->count();
    }
}
