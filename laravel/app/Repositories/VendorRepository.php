<?php

declare(strict_types=1);

namespace App\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class VendorRepository
{
    /**
     * @return LengthAwarePaginator<int, object>
     */
    public function paginate(string $search = '', int $perPage = 20): LengthAwarePaginator
    {
        $search = trim($search);

        return DB::table('vendtable as vendor')
            ->select(['vendor.vendaccount', 'vendor.name'])
            ->selectSub($this->inspectionCountQuery(), 'inspection_count')
            ->when($search !== '', function (Builder $query) use ($search): void {
                $like = '%'.$search.'%';

                $query->where(function (Builder $query) use ($like): void {
                    $query->where('vendor.vendaccount', 'like', $like)
                        ->orWhere('vendor.name', 'like', $like);
                });
            })
            ->orderBy('vendor.name')
            ->orderBy('vendor.vendaccount')
            ->paginate($perPage);
    }

    public function find(string $account): ?object
    {
        return DB::table('vendtable as vendor')
            ->select(['vendor.vendaccount', 'vendor.name'])
            ->selectSub($this->inspectionCountQuery(), 'inspection_count')
            ->where('vendor.vendaccount', $account)
            ->first();
    }

    public function exists(string $account): bool
    {
        return DB::table('vendtable')->where('vendaccount', $account)->exists();
    }

    public function isUsed(string $account): bool
    {
        return DB::table('inspecttable')->where('accountnum', $account)->exists();
    }

    public function create(string $account, string $name): void
    {
        DB::table('vendtable')->insert([
            'vendaccount' => $account,
            'name' => $name,
        ]);
    }

    public function rename(string $account, string $name): void
    {
        DB::table('vendtable')->where('vendaccount', $account)->update([
            'name' => $name,
        ]);
    }

    public function delete(string $account): int
    {
        return DB::table('vendtable')->where('vendaccount', $account)->delete();
    }

    /**
     * @param  list<array{vendaccount: string, name: string}>  $rows
     */
    public function upsert(array $rows): void
    {
        DB::table('vendtable')->upsert($rows, ['vendaccount'], ['name']);
    }

    private function inspectionCountQuery(): Builder
    {
        return DB::table('inspecttable as inspection')
            ->selectRaw('count(*)')
            ->whereColumn('inspection.accountnum', 'vendor.vendaccount');
    }
}
