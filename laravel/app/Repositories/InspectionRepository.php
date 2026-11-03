<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Domain\Inspection\InspectionStatus;
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
     * @return array<string, int>
     */
    public function statusCounts(): array
    {
        $counts = [
            InspectionStatus::DRAFT => 0,
            InspectionStatus::SUBMITTED => 0,
            InspectionStatus::CHECKED => 0,
            InspectionStatus::RETURNED => 0,
            'LEGACY' => 0,
            'TOTAL' => 0,
        ];

        $rows = DB::table('inspecttable')
            ->selectRaw("UPPER(COALESCE(inspectstatus, 'DRAFT')) as status")
            ->selectRaw('COUNT(*) as total')
            ->groupBy('status')
            ->get();

        foreach ($rows as $row) {
            $total = (int) $row->total;
            $status = InspectionStatus::normalize((string) $row->status);
            $key = array_key_exists($status, $counts) && $status !== 'TOTAL' ? $status : 'LEGACY';

            $counts[$key] += $total;
            $counts['TOTAL'] += $total;
        }

        return $counts;
    }

    /**
     * @return Collection<int, object>
     */
    public function recent(int $limit = 6): Collection
    {
        return DB::table('inspecttable')
            ->select([
                'inspectnum',
                'inspectdate',
                'itemid',
                'itemname',
                'accountnum',
                'name',
                'inspectstatus',
                'inspectby',
                'updated_at',
            ])
            ->orderByDesc('inspectdate')
            ->orderByDesc('inspectnum')
            ->limit($limit)
            ->get();
    }

    public function updateWorkflow(string $inspectnum, array $values): void
    {
        $values['updated_at'] = now();

        DB::table('inspecttable')->where('inspectnum', $inspectnum)->update($values);
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
