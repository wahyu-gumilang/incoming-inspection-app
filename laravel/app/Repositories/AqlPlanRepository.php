<?php

declare(strict_types=1);

namespace App\Repositories;

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

    public function defaultPlan(): ?object
    {
        return DB::table('aqlplan')
            ->where('isdefault', 1)
            ->first()
            ?? DB::table('aqlplan')->orderBy('planid')->first();
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
}
