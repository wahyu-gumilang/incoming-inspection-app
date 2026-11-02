<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\AqlPlanRepository;
use DomainException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class AqlPlanService
{
    public function createPlan(array $data): int
    {
        $repository = app(AqlPlanRepository::class);
        $name = trim((string) ($data['name'] ?? ''));
        $level = trim((string) ($data['inspectlevel'] ?? ''));
        $aql = trim((string) ($data['aql'] ?? ''));
        $note = trim((string) ($data['note'] ?? ''));
        $makeDefault = (bool) ($data['isdefault'] ?? false);

        $this->validatePlanMeta($name, $level, $aql, $note, $repository);

        $makeDefault = $makeDefault || ! DB::table('aqlplan')->where('isdefault', 1)->exists();

        return DB::transaction(function () use ($repository, $name, $level, $aql, $note, $makeDefault): int {
            if ($makeDefault) {
                DB::table('aqlplan')->update(['isdefault' => 0]);
            }

            return $repository->createPlan([
                'name' => $name,
                'inspectlevel' => $level,
                'aql' => $aql,
                'isdefault' => $makeDefault ? 1 : 0,
                'note' => $note !== '' ? $note : null,
            ]);
        });
    }

    public function updatePlan(int $planid, array $data, bool $makeDefault = false): void
    {
        $repository = app(AqlPlanRepository::class);

        if ($repository->find($planid) === null) {
            throw new DomainException('The AQL plan could not be found.');
        }

        $name = trim((string) ($data['name'] ?? ''));
        $level = trim((string) ($data['inspectlevel'] ?? ''));
        $aql = trim((string) ($data['aql'] ?? ''));
        $note = trim((string) ($data['note'] ?? ''));

        $this->validatePlanMeta($name, $level, $aql, $note, $repository, $planid);

        DB::transaction(function () use ($repository, $planid, $name, $level, $aql, $note, $makeDefault): void {
            $repository->updatePlan($planid, [
                'name' => $name,
                'inspectlevel' => $level,
                'aql' => $aql,
                'note' => $note !== '' ? $note : null,
            ]);

            if ($makeDefault) {
                DB::table('aqlplan')->update(['isdefault' => 0]);
                DB::table('aqlplan')->where('planid', $planid)->update(['isdefault' => 1]);
            }
        });
    }

    public function setDefault(int $planid): void
    {
        $repository = app(AqlPlanRepository::class);

        if ($repository->find($planid) === null) {
            throw new DomainException('The AQL plan could not be found.');
        }

        $repository->setDefault($planid);
    }

    public function deletePlan(int $planid): void
    {
        $repository = app(AqlPlanRepository::class);
        $plan = $repository->find($planid);

        if ($plan === null) {
            throw new DomainException('The AQL plan could not be found.');
        }

        if ($repository->planCount() <= 1) {
            throw new DomainException('At least one AQL plan is required.');
        }

        if ($repository->inspectionCount($planid) > 0) {
            throw new DomainException('This AQL plan is used by an inspection and cannot be deleted.');
        }

        $nextDefault = (int) $plan->isdefault === 1 ? $repository->nextPlanId($planid) : null;

        DB::transaction(function () use ($repository, $planid, $nextDefault): void {
            if ($nextDefault !== null) {
                $repository->setDefault($nextDefault);
            }

            $repository->deletePlan($planid);
        });
    }

    public function createRow(int $planid, array $data): void
    {
        $repository = app(AqlPlanRepository::class);

        if ($repository->find($planid) === null) {
            throw new DomainException('The AQL plan could not be found.');
        }

        $row = $this->normalizeRow($data);
        $this->assertNoOverlap($planid, $row);

        try {
            $repository->createRow([
                'planid' => $planid,
                ...$row,
            ]);
        } catch (QueryException $exception) {
            if ((string) $exception->getCode() === '23000') {
                throw new DomainException('A row with this category and lot minimum already exists.', 0, $exception);
            }

            throw $exception;
        }

        $this->touchPlan($planid);
    }

    public function updateRow(int $planid, int $originalCategory, int $originalLotmin, array $data): void
    {
        $repository = app(AqlPlanRepository::class);

        if ($repository->find($planid) === null) {
            throw new DomainException('The AQL plan could not be found.');
        }

        if ($repository->findRow($planid, $originalCategory, $originalLotmin) === null) {
            throw new DomainException('The AQL row could not be found.');
        }

        $row = $this->normalizeRow($data);
        $this->assertNoOverlap($planid, $row, $originalCategory, $originalLotmin);

        try {
            $repository->updateRow($planid, $originalCategory, $originalLotmin, $row);
        } catch (QueryException $exception) {
            if ((string) $exception->getCode() === '23000') {
                throw new DomainException('A row with this category and lot minimum already exists.', 0, $exception);
            }

            throw $exception;
        }

        $this->touchPlan($planid);
    }

    public function deleteRow(int $planid, int $category, int $lotmin): void
    {
        $repository = app(AqlPlanRepository::class);

        if ($repository->find($planid) === null) {
            throw new DomainException('The AQL plan could not be found.');
        }

        if ($repository->deleteRow($planid, $category, $lotmin) === 0) {
            throw new DomainException('The AQL row could not be found.');
        }

        $this->touchPlan($planid);
    }

    private function touchPlan(int $planid): void
    {
        DB::table('aqlplan')->where('planid', $planid)->update(['updated_at' => now()]);
    }

    private function validatePlanMeta(
        string $name,
        string $level,
        string $aql,
        string $note,
        AqlPlanRepository $repository,
        ?int $ignorePlanid = null,
    ): void {
        if ($name === '') {
            throw new DomainException('The plan name is required.');
        }

        if (mb_strlen($name) > 100) {
            throw new DomainException('The plan name must be 100 characters or fewer.');
        }

        if ($repository->planNameExists($name, $ignorePlanid)) {
            throw new DomainException('That plan name already exists.');
        }

        if ($level === '') {
            throw new DomainException('The inspection level is required.');
        }

        if (mb_strlen($level) > 10) {
            throw new DomainException('The inspection level must be 10 characters or fewer.');
        }

        if ($aql === '') {
            throw new DomainException('The AQL value is required.');
        }

        if (mb_strlen($aql) > 20) {
            throw new DomainException('The AQL value must be 20 characters or fewer.');
        }

        if (mb_strlen($note) > 255) {
            throw new DomainException('The note must be 255 characters or fewer.');
        }
    }

    /**
     * @return array{inspectcategory: int, lotmin: int, lotmax: int|null, codeletter: string, samplesize: int, acceptnum: int, rejectnum: int}
     */
    private function normalizeRow(array $data): array
    {
        $category = (int) ($data['inspectcategory'] ?? 0);
        $lotmin = (int) ($data['lotmin'] ?? 0);
        $lotmaxRaw = $data['lotmax'] ?? null;
        $lotmax = $lotmaxRaw === null || $lotmaxRaw === '' ? null : (int) $lotmaxRaw;
        $codeletter = strtoupper(trim((string) ($data['codeletter'] ?? '')));
        $samplesize = (int) ($data['samplesize'] ?? 0);
        $acceptnum = (int) ($data['acceptnum'] ?? 0);
        $rejectnum = (int) ($data['rejectnum'] ?? 0);

        if (! in_array($category, [1, 2, 3], true)) {
            throw new DomainException('Choose a valid inspection category.');
        }

        if ($lotmin < 1) {
            throw new DomainException('Lot minimum must be at least 1.');
        }

        if ($lotmax !== null && $lotmax < $lotmin) {
            throw new DomainException('Lot maximum must be greater than or equal to lot minimum.');
        }

        if ($codeletter === '') {
            throw new DomainException('The code letter is required.');
        }

        if (mb_strlen($codeletter) > 2) {
            throw new DomainException('The code letter must be 2 characters or fewer.');
        }

        if ($samplesize < 1) {
            throw new DomainException('Sample size must be at least 1.');
        }

        if ($acceptnum < 0) {
            throw new DomainException('Acceptance number cannot be negative.');
        }

        if ($rejectnum <= $acceptnum) {
            throw new DomainException('Rejection number must be greater than the acceptance number.');
        }

        return [
            'inspectcategory' => $category,
            'lotmin' => $lotmin,
            'lotmax' => $lotmax,
            'codeletter' => $codeletter,
            'samplesize' => $samplesize,
            'acceptnum' => $acceptnum,
            'rejectnum' => $rejectnum,
        ];
    }

    private function assertNoOverlap(
        int $planid,
        array $row,
        ?int $originalCategory = null,
        ?int $originalLotmin = null,
    ): void {
        $newMax = $row['lotmax'] ?? PHP_INT_MAX;

        $rows = DB::table('aqlplanrow')
            ->where('planid', $planid)
            ->where('inspectcategory', $row['inspectcategory'])
            ->get();

        foreach ($rows as $existing) {
            if (
                $originalCategory !== null
                && $originalLotmin !== null
                && (int) $existing->inspectcategory === $originalCategory
                && (int) $existing->lotmin === $originalLotmin
            ) {
                continue;
            }

            $existingMax = $existing->lotmax === null ? PHP_INT_MAX : (int) $existing->lotmax;

            if ($row['lotmin'] <= $existingMax && (int) $existing->lotmin <= $newMax) {
                $upper = $existing->lotmax === null ? '∞' : (string) $existing->lotmax;

                throw new DomainException(
                    "The lot range overlaps {$existing->lotmin}–{$upper} in the same category.",
                );
            }
        }
    }
}
