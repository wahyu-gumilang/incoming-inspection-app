<?php

declare(strict_types=1);

namespace App\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ItemRepository
{
    private const TYPES = ['STD', 'CERTIFIKAT', 'VISUAL', 'FITTING'];

    /**
     * @return LengthAwarePaginator<int, object>
     */
    public function paginate(string $term = '', string $standards = 'all', int $perPage = 20): LengthAwarePaginator
    {
        $term = trim($term);

        $query = DB::table('inventtable as item')
            ->select(['item.itemid', 'item.name'])
            ->selectSub($this->standardCountQuery(), 'standards_count');

        foreach (self::TYPES as $type) {
            $query->selectSub(
                $this->standardCountQuery($type),
                strtolower($type).'_count',
            );
        }

        $query
            ->when($term !== '', function (Builder $query) use ($term): void {
                $like = '%'.$term.'%';

                $query->where(function (Builder $query) use ($like): void {
                    $query->where('item.itemid', 'like', $like)
                        ->orWhere('item.name', 'like', $like);
                });
            })
            ->when($standards === 'with', function (Builder $query): void {
                $query->whereExists(function (Builder $query): void {
                    $query->selectRaw('1')
                        ->from('inventinspectitem as standard')
                        ->whereColumn('standard.itemid', 'item.itemid');
                });
            })
            ->when($standards === 'without', function (Builder $query): void {
                $query->whereNotExists(function (Builder $query): void {
                    $query->selectRaw('1')
                        ->from('inventinspectitem as standard')
                        ->whereColumn('standard.itemid', 'item.itemid');
                });
            })
            ->orderBy('item.itemid');

        return $query->paginate($perPage);
    }

    /**
     * @return array{total: int, with: int, without: int}
     */
    public function stats(): array
    {
        $total = DB::table('inventtable')->count();

        $with = DB::table('inventtable as item')
            ->whereExists(function (Builder $query): void {
                $query->selectRaw('1')
                    ->from('inventinspectitem as standard')
                    ->whereColumn('standard.itemid', 'item.itemid');
            })
            ->count();

        return [
            'total' => $total,
            'with' => $with,
            'without' => $total - $with,
        ];
    }

    public function find(string $itemid): ?object
    {
        return DB::table('inventtable as item')
            ->select(['item.itemid', 'item.name'])
            ->selectSub($this->standardCountQuery(), 'standards_count')
            ->where('item.itemid', $itemid)
            ->first();
    }

    /**
     * @return Collection<int, object>
     */
    public function standardsFor(string $itemid): Collection
    {
        return DB::table('inventinspectitem')
            ->select([
                'itemid',
                'inspecttype',
                'inspectitem',
                'standard_txt',
                'standard',
                'tolerance',
                'tolerance_plus',
                'tolerance_minus',
            ])
            ->where('itemid', $itemid)
            ->orderByRaw('TRIM(inspecttype), inspectitem')
            ->get();
    }

    public function exists(string $itemid): bool
    {
        return DB::table('inventtable')->where('itemid', $itemid)->exists();
    }

    public function findStandard(string $itemid, string $type, string $inspectitem): ?object
    {
        return DB::table('inventinspectitem')
            ->where('itemid', $itemid)
            ->where('inspecttype', $type)
            ->where('inspectitem', $inspectitem)
            ->first();
    }

    public function standardExists(string $itemid, string $type, string $inspectitem): bool
    {
        return DB::table('inventinspectitem')
            ->where('itemid', $itemid)
            ->whereRaw('TRIM(inspecttype) = ?', [trim($type)])
            ->whereRaw('TRIM(inspectitem) = ?', [trim($inspectitem)])
            ->exists();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createStandard(array $data): void
    {
        DB::table('inventinspectitem')->insert($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateStandard(string $itemid, string $type, string $inspectitem, array $data): int
    {
        return DB::table('inventinspectitem')
            ->where('itemid', $itemid)
            ->where('inspecttype', $type)
            ->where('inspectitem', $inspectitem)
            ->update($data);
    }

    public function deleteStandard(string $itemid, string $type, string $inspectitem): int
    {
        return DB::table('inventinspectitem')
            ->where('itemid', $itemid)
            ->where('inspecttype', $type)
            ->where('inspectitem', $inspectitem)
            ->delete();
    }

    private function standardCountQuery(?string $type = null): Builder
    {
        return DB::table('inventinspectitem as standard')
            ->selectRaw('count(*)')
            ->whereColumn('standard.itemid', 'item.itemid')
            ->when($type !== null, function (Builder $query) use ($type): void {
                $query->whereRaw('TRIM(standard.inspecttype) = ?', [$type]);
            });
    }
}
