<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Inspection\InspectionStatus;
use App\Models\User;
use App\Repositories\InspectionRepository;
use DomainException;

class InspectionWorkflowService
{
    public function __construct(
        private readonly InspectionRepository $inspections,
    ) {}

    public function submit(string $inspectnum, User $user): void
    {
        $inspection = $this->find($inspectnum);
        $status = InspectionStatus::normalize($inspection->inspectstatus);

        if (! InspectionStatus::isEditable($status)) {
            throw new DomainException('Only draft or returned inspections can be submitted.');
        }

        $ownerId = $inspection->inspectbyid;

        if (! $user->isChecker() && $ownerId !== null && (int) $ownerId !== (int) $user->userid) {
            throw new DomainException('Only the inspector who created this inspection can submit it.');
        }

        $this->inspections->updateWorkflow($inspectnum, [
            'inspectstatus' => InspectionStatus::SUBMITTED,
            'submitted_at' => now(),
            'returned_at' => null,
            'checked_at' => null,
            'checkedby' => null,
            'checkedbyid' => null,
            'return_note' => null,
        ]);
    }

    public function approve(string $inspectnum, User $user): void
    {
        $this->assertChecker($user);
        $inspection = $this->find($inspectnum);
        $this->assertSubmitted($inspection);

        $this->inspections->updateWorkflow($inspectnum, [
            'inspectstatus' => InspectionStatus::CHECKED,
            'checkedby' => $user->fullname,
            'checkedbyid' => $user->userid,
            'checked_at' => now(),
            'return_note' => null,
        ]);
    }

    public function returnToInspector(string $inspectnum, User $user, string $note): void
    {
        $this->assertChecker($user);
        $inspection = $this->find($inspectnum);
        $this->assertSubmitted($inspection);

        $note = trim($note);

        if ($note === '') {
            throw new DomainException('Enter a reason before returning the inspection.');
        }

        if (mb_strlen($note) > 255) {
            throw new DomainException('The return reason must be 255 characters or fewer.');
        }

        $this->inspections->updateWorkflow($inspectnum, [
            'inspectstatus' => InspectionStatus::RETURNED,
            'checkedby' => $user->fullname,
            'checkedbyid' => $user->userid,
            'returned_at' => now(),
            'checked_at' => null,
            'return_note' => $note,
        ]);
    }

    private function find(string $inspectnum): object
    {
        return $this->inspections->find($inspectnum)
            ?? throw new DomainException('The inspection could not be found.');
    }

    private function assertChecker(User $user): void
    {
        if (! $user->isChecker()) {
            throw new DomainException('Only a checker can review an inspection.');
        }
    }

    private function assertSubmitted(object $inspection): void
    {
        if (InspectionStatus::normalize($inspection->inspectstatus) !== InspectionStatus::SUBMITTED) {
            throw new DomainException('Only submitted inspections can be checked.');
        }
    }
}
