<?php

declare(strict_types=1);

namespace App\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AqlPlanRepository
{
    /**
     * @return Collection<int, object>
     */
    public function plans(): Collection
    {
        return DB::table('aqlplan')
            ->select(['planid', 'name', 'inspectlevel', 'aql', 'isdefault', 'note'])
            ->orderByDesc('isdefault')
            ->orderBy('name')
            ->get();
    }

    /**
     * @return LengthAwarePaginator<int, object>
     */
    public function paginate(string $search = '', int $perPage = 20): LengthAwarePaginator
    {
        $search = trim($search);

        return DB::table('aqlplan as plan')
            ->select(['plan.planid', 'plan.name', 'plan.inspectlevel', 'plan.aql', 'plan.isdefault', 'plan.note', 'plan.updated_at'])
            ->selectSub($this->rowCountQuery(), 'row_count')
            ->selectSub($this->inspectionCountQuery(), 'inspection_count')
            ->when($search !== '', function (Builder $query) use ($search): void {
                $like = '%'.$search.'%';

                $query->where(function (Builder $query) use ($like): void {
                    $query->where('plan.name', 'like', $like)
                        ->orWhere('plan.inspectlevel', 'like', $like)
                        ->orWhere('plan.aql', 'like', $like);
                });
            })
            ->orderByDesc('plan.isdefault')
            ->orderBy('plan.name')
            ->paginate($perPage);
    }

    public function find(int $planid): ?object
    {
        return DB::table('aqlplan as plan')
            ->select(['plan.planid', 'plan.name', 'plan.inspectlevel', 'plan.aql', 'plan.isdefault', 'plan.note', 'plan.updated_at'])
            ->selectSub($this->rowCountQuery(), 'row_count')
            ->selectSub($this->inspectionCountQuery(), 'inspection_count')
            ->where('plan.planid', $planid)
            ->first();
    }

    public function defaultPlan(): ?object
    {
        return DB::table('aqlplan')
            ->where('isdefault', 1)
            ->first()
            ?? DB::table('aqlplan')->orderBy('planid')->first();
    }

    public function planCount(): int
    {
        return DB::table('aqlplan')->count();
    }

    public function planNameExists(string $name, ?int $ignorePlanid = null): bool
    {
        return DB::table('aqlplan')
            ->where('name', $name)
            ->when($ignorePlanid !== null, fn (Builder $query) => $query->where('planid', '!=', $ignorePlanid))
            ->exists();
    }

    public function rowCount(): int
    {
        return DB::table('aqlplanrow')->count();
    }

    public function inspectionCount(int $planid): int
    {
        return DB::table('inspecttable')->where('aqlplanid', $planid)->count();
    }

    public function createPlan(array $data): int
    {
        return (int) DB::table('aqlplan')->insertGetId($data);
    }

    public function updatePlan(int $planid, array $data): void
    {
        DB::table('aqlplan')->where('planid', $planid)->update($data);
    }

    public function deletePlan(int $planid): int
    {
        return DB::table('aqlplan')->where('planid', $planid)->delete();
    }

    public function setDefault(int $planid): void
    {
        DB::transaction(function () use ($planid): void {
            DB::table('aqlplan')->update(['isdefault' => 0]);
            DB::table('aqlplan')->where('planid', $planid)->update(['isdefault' => 1]);
        });
    }

    public function nextPlanId(int $excludePlanid): ?int
    {
        $planid = DB::table('aqlplan')
            ->where('planid', '!=', $excludePlanid)
            ->orderByDesc('isdefault')
            ->orderBy('name')
            ->value('planid');

        return $planid !== null ? (int) $planid : null;
    }

    /**
     * @return Collection<int, object>
     */
    public function rowsFor(int $planid): Collection
    {
        return DB::table('aqlplanrow')
            ->where('planid', $planid)
            ->orderBy('inspectcategory')
            ->orderBy('lotmin')
            ->get();
    }

    public function findRow(int $planid, int $category, int $lotmin): ?object
    {
        return DB::table('aqlplanrow')
            ->where('planid', $planid)
            ->where('inspectcategory', $category)
            ->where('lotmin', $lotmin)
            ->first();
    }

    public function createRow(array $data): void
    {
        DB::table('aqlplanrow')->insert($data);
    }

    public function updateRow(int $planid, int $originalCategory, int $originalLotmin, array $data): int
    {
        return DB::table('aqlplanrow')
            ->where('planid', $planid)
            ->where('inspectcategory', $originalCategory)
            ->where('lotmin', $originalLotmin)
            ->update($data);
    }

    public function deleteRow(int $planid, int $category, int $lotmin): int
    {
        return DB::table('aqlplanrow')
            ->where('planid', $planid)
            ->where('inspectcategory', $category)
            ->where('lotmin', $lotmin)
            ->delete();
    }

    public function rowFor(int $planid, int $category, int $qty): ?object
    {
        if ($qty <= 0) {
            return null;
        }

        if ($category === 0) {
            return (object) [
                'inspectcategory' => 0,
                'lotmin' => 1,
                'lotmax' => null,
                'codeletter' => '100%',
                'samplesize' => $qty,
                'acceptnum' => 0,
                'rejectnum' => 1,
            ];
        }

        if (! in_array($category, [1, 2, 3], true)) {
            return null;
        }

        return DB::table('aqlplanrow')
            ->where('planid', $planid)
            ->where('inspectcategory', $category)
            ->where('lotmin', '<=', $qty)
            ->where(function ($query) use ($qty): void {
                $query->whereNull('lotmax')->orWhere('lotmax', '>=', $qty);
            })
            ->orderByDesc('lotmin')
            ->first();
    }

    private function rowCountQuery(): Builder
    {
        return DB::table('aqlplanrow as plan_row')
            ->selectRaw('count(*)')
            ->whereColumn('plan_row.planid', 'plan.planid');
    }

    private function inspectionCountQuery(): Builder
    {
        return DB::table('inspecttable as inspection')
            ->selectRaw('count(*)')
            ->whereColumn('inspection.aqlplanid', 'plan.planid');
    }
}
