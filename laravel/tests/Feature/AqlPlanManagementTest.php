<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\User\Role;
use App\Livewire\AqlPlans\AqlPlanDetail;
use App\Livewire\AqlPlans\AqlPlanManager;
use App\Livewire\Inspections\InspectionForm;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Livewire\Livewire;
use Tests\TestCase;

class AqlPlanManagementTest extends TestCase
{
    use DatabaseTransactions;

    public function test_checker_can_manage_plans_from_the_aql_table(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        $this->actingAs($checker)
            ->get('/aql')
            ->assertOk()
            ->assertSee('Manage plans')
            ->assertDontSee('AQL Plans');

        Livewire::actingAs($checker)
            ->test(InspectionForm::class)
            ->call('togglePlanAdmin')
            ->assertSet('showPlanAdmin', true)
            ->assertSee('Manage AQL plans')
            ->assertSee('Current practice');
    }

    public function test_inspector_cannot_manage_aql_plans(): void
    {
        $inspector = $this->makeUser();

        $this->actingAs($inspector)
            ->get('/aql')
            ->assertOk()
            ->assertDontSee('Manage plans');
    }

    public function test_checker_can_create_a_plan_and_make_it_default(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        Livewire::actingAs($checker)
            ->test(AqlPlanManager::class)
            ->call('openCreate')
            ->assertSet('showCreate', true)
            ->set('name', 'Test sampling plan')
            ->set('inspectlevel', 'T-1')
            ->set('aql', '1.5')
            ->set('note', 'Created by the test suite.')
            ->set('makeDefault', true)
            ->call('createPlan')
            ->assertHasNoErrors()
            ->assertSet('showCreate', false)
            ->assertSet('statusMessage', 'AQL plan created.');

        $plan = DB::table('aqlplan')->where('name', 'Test sampling plan')->first();

        $this->assertNotNull($plan);
        $this->assertSame(1, (int) $plan->isdefault);
        $this->assertSame(0, (int) DB::table('aqlplan')->where('planid', 1)->value('isdefault'));
    }

    public function test_checker_can_edit_a_plan(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        Livewire::actingAs($checker)
            ->test(AqlPlanManager::class)
            ->call('openEdit', 2)
            ->set('name', 'ISO General Level II, updated')
            ->set('inspectlevel', 'II')
            ->set('aql', '2.5')
            ->set('note', 'Updated note.')
            ->call('saveEdit')
            ->assertHasNoErrors()
            ->assertSet('showEdit', false)
            ->assertSet('statusMessage', 'AQL plan updated.');

        $this->assertDatabaseHas('aqlplan', [
            'planid' => 2,
            'name' => 'ISO General Level II, updated',
            'note' => 'Updated note.',
        ]);
    }

    public function test_checker_can_set_the_default_plan(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        Livewire::actingAs($checker)
            ->test(AqlPlanManager::class)
            ->call('setDefault', 2)
            ->assertSet('statusMessage', 'Default AQL plan updated.');

        $this->assertSame(0, (int) DB::table('aqlplan')->where('planid', 1)->value('isdefault'));
        $this->assertSame(1, (int) DB::table('aqlplan')->where('planid', 2)->value('isdefault'));
    }

    public function test_plan_used_by_an_inspection_cannot_be_deleted(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        DB::table('inspecttable')->insert([
            'inspectnum' => 'INS-AQL-001',
            'aqlplanid' => 1,
        ]);

        Livewire::actingAs($checker)
            ->test(AqlPlanManager::class)
            ->call('confirmDelete', 1)
            ->assertSet('showDelete', false)
            ->assertSet('errorMessage', 'This AQL plan is used by an inspection and cannot be deleted.');

        $this->assertDatabaseHas('aqlplan', ['planid' => 1]);
    }

    public function test_deleting_the_default_plan_promotes_another_plan(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        Livewire::actingAs($checker)
            ->test(AqlPlanManager::class)
            ->call('confirmDelete', 1)
            ->assertSet('showDelete', true)
            ->call('deletePlan')
            ->assertSet('showDelete', false)
            ->assertSet('statusMessage', 'AQL plan deleted.');

        $this->assertDatabaseMissing('aqlplan', ['planid' => 1]);
        $this->assertSame(1, (int) DB::table('aqlplan')->where('planid', 2)->value('isdefault'));
    }

    public function test_checker_can_create_edit_and_delete_a_sampling_row(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        Livewire::actingAs($checker)
            ->test(AqlPlanDetail::class, ['planid' => 2])
            ->call('openCreateRow')
            ->set('rowCategory', 3)
            ->set('rowLotmin', '1')
            ->set('rowLotmax', '10')
            ->set('rowCodeletter', 'A')
            ->set('rowSamplesize', '2')
            ->set('rowAcceptnum', '0')
            ->set('rowRejectnum', '1')
            ->call('saveRow')
            ->assertHasNoErrors()
            ->assertSet('showRow', false)
            ->assertSet('statusMessage', 'AQL row added.')
            ->call('openEditRow', 3, 1)
            ->assertSet('editingRow', true)
            ->set('rowLotmax', '12')
            ->set('rowSamplesize', '3')
            ->call('saveRow')
            ->assertHasNoErrors()
            ->assertSet('statusMessage', 'AQL row updated.');

        $this->assertDatabaseHas('aqlplanrow', [
            'planid' => 2,
            'inspectcategory' => 3,
            'lotmin' => 1,
            'lotmax' => 12,
            'codeletter' => 'A',
            'samplesize' => 3,
        ]);

        Livewire::actingAs($checker)
            ->test(AqlPlanDetail::class, ['planid' => 2])
            ->call('confirmDeleteRow', 3, 1)
            ->assertSet('showDeleteRow', true)
            ->call('deleteRow')
            ->assertSet('showDeleteRow', false)
            ->assertSet('statusMessage', 'AQL row deleted.');

        $this->assertDatabaseMissing('aqlplanrow', ['planid' => 2, 'inspectcategory' => 3, 'lotmin' => 1]);
    }

    public function test_overlapping_sampling_ranges_are_rejected(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        Livewire::actingAs($checker)
            ->test(AqlPlanDetail::class, ['planid' => 2])
            ->call('openCreateRow')
            ->set('rowCategory', 1)
            ->set('rowLotmin', '40')
            ->set('rowLotmax', '60')
            ->set('rowCodeletter', 'A')
            ->set('rowSamplesize', '2')
            ->set('rowAcceptnum', '0')
            ->set('rowRejectnum', '1')
            ->call('saveRow')
            ->assertHasErrors('rowLotmin');

        $this->assertDatabaseMissing('aqlplanrow', ['planid' => 2, 'inspectcategory' => 1, 'lotmin' => 40]);
    }

    public function test_aql_plan_detail_shows_sampling_rows(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        Livewire::actingAs($checker)
            ->test(AqlPlanDetail::class, ['planid' => 2])
            ->assertSee('Sampling rows')
            ->assertSee('1201')
            ->assertSee('Normal')
            ->assertSee('Add row')
            ->assertSee('All plans');
    }

    public function test_plan_deletion_from_detail_closes_the_dialog(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        Livewire::actingAs($checker)
            ->test(AqlPlanDetail::class, ['planid' => 2])
            ->call('deletePlan')
            ->assertDispatched('aql-plan-close')
            ->assertDispatched('aql-plan-deleted');

        $this->assertDatabaseMissing('aqlplan', ['planid' => 2]);
    }

    public function test_manager_opens_plan_rows_inline(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        Livewire::actingAs($checker)
            ->test(AqlPlanManager::class)
            ->call('openPlan', 2)
            ->assertSet('selectedPlanid', 2)
            ->assertSee('Sampling rows')
            ->call('closePlan')
            ->assertSet('selectedPlanid', null);
    }
}
