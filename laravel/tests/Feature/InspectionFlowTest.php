<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Livewire\Inspections\InspectionForm;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Livewire\Livewire;
use Tests\TestCase;

class InspectionFlowTest extends TestCase
{
    use DatabaseTransactions;

    public function test_aql_values_are_calculated_from_the_delivery(): void
    {
        $user = $this->makeUser();

        Livewire::actingAs($user)
            ->test(InspectionForm::class)
            ->set('itemid', '000-228')
            ->set('accountnum', 'V-0001')
            ->assertSet('aql', [])
            ->set('deliveries.1.qty', '50')
            ->set('deliveries.1.category', '1')
            ->assertSet('aql.1.samplesize', 2)
            ->assertSet('aql.1.acceptnum', 0)
            ->assertSet('aql.1.rejectnum', 1);
    }

    public function test_user_can_save_an_inspection_and_open_the_report(): void
    {
        $user = $this->makeUser();

        Livewire::actingAs($user)
            ->test(InspectionForm::class)
            ->set('itemid', '000-228')
            ->set('accountnum', 'V-0001')
            ->set('deliveries.1.po', 'PO-TEST')
            ->set('deliveries.1.date', '2026-10-30')
            ->set('deliveries.1.qty', '50')
            ->set('deliveries.1.category', '1')
            ->set('deliveries.1.notgood', '0')
            ->set('deliveries.1.judgment', '1')
            ->call('save')
            ->assertHasNoErrors()
            ->assertRedirect();

        $inspection = DB::table('inspecttable')->orderByDesc('created_at')->first();

        $this->assertNotNull($inspection);
        $this->assertSame('DRAFT', $inspection->inspectstatus);
        $this->assertSame('000-228', $inspection->itemid);
        $this->assertSame('V-0001', $inspection->accountnum);
        $this->assertSame(2, (int) $inspection->samplesize1);
        $this->assertSame(0, (int) $inspection->acceptnum1);
        $this->assertSame(1, (int) $inspection->rejectnum1);

        $this->actingAs($user)
            ->get('/reports/'.$inspection->inspectnum)
            ->assertOk()
            ->assertSee('INCOMING INSPECTION CHECK LIST')
            ->assertSee($inspection->inspectnum)
            ->assertSee('Handle Rhino Prima')
            ->assertSee('PO-TEST');
    }

    public function test_reports_page_lists_saved_inspections(): void
    {
        $user = $this->makeUser();

        DB::table('inspecttable')->insert([
            'inspectnum' => 'INS-TEST-REPORT',
            'inspectdate' => '2026-10-30',
            'itemid' => '000-228',
            'itemname' => 'Handle Rhino Prima',
            'accountnum' => 'V-0001',
            'name' => 'PT Sinar Logam Abadi',
            'inspectstatus' => 'DRAFT',
            'inspectby' => 'Test User',
        ]);

        $this->actingAs($user)
            ->get('/reports')
            ->assertOk()
            ->assertSee('INS-TEST-REPORT')
            ->assertSee('Handle Rhino Prima');
    }

    public function test_accepted_judgment_is_rejected_when_ng_exceeds_acceptance(): void
    {
        $user = $this->makeUser();

        Livewire::actingAs($user)
            ->test(InspectionForm::class)
            ->set('itemid', '000-228')
            ->set('accountnum', 'V-0001')
            ->set('deliveries.1.qty', '50')
            ->set('deliveries.1.category', '1')
            ->set('deliveries.1.notgood', '1')
            ->set('deliveries.1.judgment', '1')
            ->call('save')
            ->assertHasErrors('deliveries.1.judgment');
    }

    public function test_delivery_category_is_required_when_quantity_is_entered(): void
    {
        $user = $this->makeUser();

        Livewire::actingAs($user)
            ->test(InspectionForm::class)
            ->set('itemid', '000-228')
            ->set('accountnum', 'V-0001')
            ->set('deliveries.1.qty', '50')
            ->set('deliveries.1.category', '')
            ->call('save')
            ->assertHasErrors('deliveries.1.category');
    }
}
