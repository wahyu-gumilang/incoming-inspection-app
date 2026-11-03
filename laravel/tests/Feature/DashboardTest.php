<?php

namespace Tests\Feature;

use App\Domain\Inspection\InspectionStatus;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use DatabaseTransactions;

    public function test_signed_in_user_sees_the_dashboard(): void
    {
        $user = $this->makeUser(['fullname' => 'Budi Santoso']);

        $this->actingAs($user)
            ->get('/')
            ->assertOk()
            ->assertSee('Dashboard')
            ->assertSee('Budi Santoso')
            ->assertSee('Recent inspections')
            ->assertSee('Quick actions')
            ->assertSee('Master data')
            ->assertSee('New inspection');
    }

    public function test_dashboard_shows_workflow_counts_and_recent_inspections(): void
    {
        $user = $this->makeUser();
        $other = $this->makeUser(['fullname' => 'Inspector One']);

        DB::table('inspecttable')->insert([
            [
                'inspectnum' => 'INS-DASH-001',
                'inspectdate' => now()->toDateString(),
                'itemid' => '000-228',
                'itemname' => 'Handle Rhino Prima',
                'accountnum' => 'V-0001',
                'name' => 'PT Sinar Logam Abadi',
                'inspectstatus' => InspectionStatus::DRAFT,
                'inspectby' => 'Inspector One',
                'inspectbyid' => $other->userid,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'inspectnum' => 'INS-DASH-002',
                'inspectdate' => now()->toDateString(),
                'itemid' => '000-228',
                'itemname' => 'Handle Rhino Prima',
                'accountnum' => 'V-0001',
                'name' => 'PT Sinar Logam Abadi',
                'inspectstatus' => InspectionStatus::CHECKED,
                'inspectby' => 'Inspector One',
                'inspectbyid' => $other->userid,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->actingAs($user)
            ->get('/')
            ->assertOk()
            ->assertSee('INS-DASH-001')
            ->assertSee('INS-DASH-002')
            ->assertSee('Inspector One')
            ->assertSee('Checked');
    }
}
