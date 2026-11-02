<?php

declare(strict_types=1);

namespace App\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class InspectionRepository
{
    /**
     * @return LengthAwarePaginator<int, object>
     */
    public function paginate(string $search = '', int $perPage = 20): LengthAwarePaginator
    {
        $search = trim($search);

        return DB::table('inspecttable as inspection')
            ->select([
                'inspection.inspectnum',
                'inspection.inspectdate',
                'inspection.itemid',
                'inspection.itemname',
                'inspection.accountnum',
                'inspection.name',
                'inspection.inspectstatus',
                'inspection.inspectby',
                'inspection.checkedby',
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $like = '%'.$search.'%';

                $query->where(function ($query) use ($like): void {
                    $query->where('inspection.inspectnum', 'like', $like)
                        ->orWhere('inspection.itemid', 'like', $like)
                        ->orWhere('inspection.itemname', 'like', $like)
                        ->orWhere('inspection.accountnum', 'like', $like)
                        ->orWhere('inspection.name', 'like', $like);
                });
            })
            ->orderByDesc('inspection.inspectdate')
            ->orderByDesc('inspection.inspectnum')
            ->paginate($perPage);
    }

    public function find(string $inspectnum): ?object
    {
        return DB::table('inspecttable')->where('inspectnum', $inspectnum)->first();
    }

    /**
     * @return Collection<int, object>
     */
    public function lines(string $inspectnum): Collection
    {
        return DB::table('inspectline')
            ->where('inspectnum', $inspectnum)
            ->orderBy('linenum')
            ->get();
    }

    /**
     * @return Collection<int, object>
     */
    public function otherLines(string $inspectnum): Collection
    {
        return DB::table('inspectlineother')
            ->where('inspectnum', $inspectnum)
            ->orderBy('linenum')
            ->get();
    }

    public function plan(?int $planid): ?object
    {
        if ($planid === null) {
            return null;
        }

        return DB::table('aqlplan')->where('planid', $planid)->first();
    }
}
