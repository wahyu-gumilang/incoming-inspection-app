<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Inspection\InspectionStatus;
use App\Domain\User\Role;
use App\Livewire\Inspections\InspectionForm;
use App\Livewire\Inspections\InspectionWorkflow;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Livewire\Livewire;
use Tests\TestCase;

class InspectionWorkflowTest extends TestCase
{
    use DatabaseTransactions;

    public function test_inspector_can_submit_an_own_draft(): void
    {
        $inspector = $this->makeUser(['role' => Role::INSPECTOR, 'fullname' => 'Inspector One']);
        $inspectnum = $this->makeInspection($inspector);

        Livewire::actingAs($inspector)
            ->test(InspectionWorkflow::class, ['inspectnum' => $inspectnum])
            ->call('submit')
            ->assertRedirect(route('reports.show', ['inspectnum' => $inspectnum]));

        $inspection = DB::table('inspecttable')->where('inspectnum', $inspectnum)->first();

        $this->assertSame(InspectionStatus::SUBMITTED, $inspection->inspectstatus);
        $this->assertNotNull($inspection->submitted_at);
    }

    public function test_inspector_cannot_submit_another_users_draft(): void
    {
        $owner = $this->makeUser(['role' => Role::INSPECTOR]);
        $other = $this->makeUser(['role' => Role::INSPECTOR]);
        $inspectnum = $this->makeInspection($owner);

        Livewire::actingAs($other)
            ->test(InspectionWorkflow::class, ['inspectnum' => $inspectnum])
            ->call('submit')
            ->assertSet('errorMessage', 'Only the inspector who created this inspection can submit it.');

        $this->assertSame(
            InspectionStatus::DRAFT,
            DB::table('inspecttable')->where('inspectnum', $inspectnum)->value('inspectstatus'),
        );
    }

    public function test_checker_can_approve_a_submitted_inspection(): void
    {
        $inspector = $this->makeUser(['role' => Role::INSPECTOR]);
        $checker = $this->makeUser(['role' => Role::CHECKER, 'fullname' => 'Checker One']);
        $inspectnum = $this->makeInspection($inspector, ['inspectstatus' => InspectionStatus::SUBMITTED]);

        Livewire::actingAs($checker)
            ->test(InspectionWorkflow::class, ['inspectnum' => $inspectnum])
            ->call('approve')
            ->assertRedirect(route('reports.show', ['inspectnum' => $inspectnum]));

        $inspection = DB::table('inspecttable')->where('inspectnum', $inspectnum)->first();

        $this->assertSame(InspectionStatus::CHECKED, $inspection->inspectstatus);
        $this->assertSame('Checker One', $inspection->checkedby);
        $this->assertSame($checker->userid, (int) $inspection->checkedbyid);
        $this->assertNotNull($inspection->checked_at);
    }

    public function test_checker_can_return_a_submitted_inspection_with_a_reason(): void
    {
        $inspector = $this->makeUser(['role' => Role::INSPECTOR]);
        $checker = $this->makeUser(['role' => Role::CHECKER]);
        $inspectnum = $this->makeInspection($inspector, ['inspectstatus' => InspectionStatus::SUBMITTED]);

        Livewire::actingAs($checker)
            ->test(InspectionWorkflow::class, ['inspectnum' => $inspectnum])
            ->call('openReturn')
            ->call('returnToInspector')
            ->assertHasErrors('returnNote')
            ->set('returnNote', 'Please correct the visual result.')
            ->call('returnToInspector')
            ->assertRedirect(route('reports.show', ['inspectnum' => $inspectnum]));

        $inspection = DB::table('inspecttable')->where('inspectnum', $inspectnum)->first();

        $this->assertSame(InspectionStatus::RETURNED, $inspection->inspectstatus);
        $this->assertSame('Please correct the visual result.', $inspection->return_note);
        $this->assertNotNull($inspection->returned_at);
    }

    public function test_inspector_cannot_approve_or_return_an_inspection(): void
    {
        $inspector = $this->makeUser(['role' => Role::INSPECTOR]);
        $inspectnum = $this->makeInspection($inspector, ['inspectstatus' => InspectionStatus::SUBMITTED]);

        Livewire::actingAs($inspector)
            ->test(InspectionWorkflow::class, ['inspectnum' => $inspectnum])
            ->call('approve')
            ->assertSet('errorMessage', 'Only a checker can review an inspection.');

        Livewire::actingAs($inspector)
            ->test(InspectionWorkflow::class, ['inspectnum' => $inspectnum])
            ->call('openReturn')
            ->set('returnNote', 'No')
            ->call('returnToInspector')
            ->assertSet('errorMessage', 'Only a checker can review an inspection.');
    }

    public function test_returned_inspection_can_be_edited_by_its_owner(): void
    {
        $inspector = $this->makeUser(['role' => Role::INSPECTOR]);
        $inspectnum = $this->makeInspection($inspector, ['inspectstatus' => InspectionStatus::RETURNED]);

        $this->actingAs($inspector)
            ->get('/aql/'.$inspectnum.'/edit')
            ->assertOk()
            ->assertSee('Edit AQL Table')
            ->assertSee($inspectnum);
    }

    public function test_submitted_or_checked_inspection_cannot_be_edited(): void
    {
        $inspector = $this->makeUser(['role' => Role::INSPECTOR]);

        foreach ([InspectionStatus::SUBMITTED, InspectionStatus::CHECKED] as $status) {
            $inspectnum = $this->makeInspection($inspector, ['inspectstatus' => $status]);

            $this->actingAs($inspector)
                ->get('/aql/'.$inspectnum.'/edit')
                ->assertForbidden();
        }
    }

    public function test_editing_a_draft_updates_the_saved_inspection(): void
    {
        $inspector = $this->makeUser(['role' => Role::INSPECTOR]);
        $inspectnum = $this->makeInspection($inspector, [
            'purchordernum1' => 'PO-OLD',
            'qty_received1' => 50,
            'inspectcategory1' => 1,
            'judgment1' => 1,
            'aqlplanid' => 1,
        ]);

        Livewire::actingAs($inspector)
            ->test(InspectionForm::class, ['inspectnum' => $inspectnum])
            ->assertSet('editing', true)
            ->assertSet('deliveries.1.po', 'PO-OLD')
            ->set('deliveries.1.po', 'PO-NEW')
            ->call('save')
            ->assertHasNoErrors();

        $this->assertDatabaseHas('inspecttable', [
            'inspectnum' => $inspectnum,
            'purchordernum1' => 'PO-NEW',
            'inspectstatus' => InspectionStatus::DRAFT,
        ]);
    }

    public function test_legacy_inspection_status_is_read_only(): void
    {
        $inspector = $this->makeUser(['role' => Role::INSPECTOR]);
        $inspectnum = $this->makeInspection($inspector, ['inspectstatus' => '1']);

        $this->actingAs($inspector)
            ->get('/aql/'.$inspectnum.'/edit')
            ->assertForbidden();
    }

    public function test_checked_inspection_can_be_downloaded_as_pdf(): void
    {
        $inspector = $this->makeUser(['role' => Role::INSPECTOR]);
        $inspectnum = $this->makeInspection($inspector, [
            'inspectstatus' => InspectionStatus::CHECKED,
            'checkedby' => 'Checker One',
            'checked_at' => now(),
        ]);

        $response = $this->actingAs($inspector)
            ->get('/reports/'.$inspectnum.'/pdf')
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->assertStringStartsWith('%PDF-', $response->getContent());
    }

    public function test_unchecked_inspection_cannot_be_downloaded_as_pdf(): void
    {
        $inspector = $this->makeUser(['role' => Role::INSPECTOR]);
        $inspectnum = $this->makeInspection($inspector);

        $this->actingAs($inspector)
            ->get('/reports/'.$inspectnum.'/pdf')
            ->assertForbidden();
    }

    private function makeInspection(User $owner, array $overrides = []): string
    {
        $inspectnum = 'INS-WF-'.Str::upper(Str::random(6));

        DB::table('inspecttable')->insert(array_merge([
            'inspectnum' => $inspectnum,
            'inspectdate' => now()->toDateString(),
            'itemid' => '000-228',
            'itemname' => 'Handle Rhino Prima',
            'accountnum' => 'V-0001',
            'name' => 'PT Sinar Logam Abadi',
            'inspectstatus' => InspectionStatus::DRAFT,
            'inspectby' => $owner->fullname,
            'inspectbyid' => $owner->userid,
            'checkedby' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ], $overrides));

        return $inspectnum;
    }
}
