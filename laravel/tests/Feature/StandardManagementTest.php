<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\User\Role;
use App\Livewire\Items\ItemDetail;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Livewire\Livewire;
use Tests\TestCase;

class StandardManagementTest extends TestCase
{
    use DatabaseTransactions;

    public function test_checker_can_add_a_std_standard(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        Livewire::actingAs($checker)
            ->test(ItemDetail::class, ['itemid' => '000-228'])
            ->call('openStandardCreate', 'STD')
            ->assertSet('showStandard', true)
            ->set('standardItem', 'ZZ TEST STD')
            ->set('standardValue', '10.50')
            ->set('tolerance', '±0.10')
            ->set('tolerancePlus', '0.10')
            ->set('toleranceMinus', '0.10')
            ->call('saveStandard')
            ->assertHasNoErrors()
            ->assertSet('showStandard', false)
            ->assertSet('statusMessage', 'Standard added.');

        $this->assertDatabaseHas('inventinspectitem', [
            'itemid' => '000-228',
            'inspecttype' => 'STD',
            'inspectitem' => 'ZZ TEST STD',
            'standard' => 10.50,
            'tolerance' => '±0.10',
            'tolerance_plus' => 0.10,
            'tolerance_minus' => 0.10,
        ]);
    }

    public function test_checker_can_add_a_text_standard(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        Livewire::actingAs($checker)
            ->test(ItemDetail::class, ['itemid' => '000-228'])
            ->call('openStandardCreate', 'VISUAL')
            ->set('standardItem', 'ZZ TEST VISUAL')
            ->set('standardText', 'No scratches')
            ->set('tolerance', 'Visual OK')
            ->call('saveStandard')
            ->assertHasNoErrors()
            ->assertSet('showStandard', false);

        $this->assertDatabaseHas('inventinspectitem', [
            'itemid' => '000-228',
            'inspecttype' => 'VISUAL',
            'inspectitem' => 'ZZ TEST VISUAL',
            'standard_txt' => 'No scratches',
            'standard' => 0,
            'tolerance' => 'Visual OK',
        ]);
    }

    public function test_checker_can_update_and_delete_a_standard(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        Livewire::actingAs($checker)
            ->test(ItemDetail::class, ['itemid' => '000-228'])
            ->call('openStandardEdit', 'STD', 'A')
            ->assertSet('editingStandard', true)
            ->assertSet('standardItem', 'A')
            ->set('standardValue', '13.50')
            ->set('tolerance', '±0.20')
            ->set('tolerancePlus', '0.20')
            ->set('toleranceMinus', '0.20')
            ->call('saveStandard')
            ->assertHasNoErrors();

        $this->assertDatabaseHas('inventinspectitem', [
            'itemid' => '000-228',
            'inspecttype' => 'STD',
            'inspectitem' => 'A',
            'standard' => 13.50,
        ]);

        Livewire::actingAs($checker)
            ->test(ItemDetail::class, ['itemid' => '000-228'])
            ->call('confirmStandardDelete', 'STD', 'A')
            ->assertSet('showDeleteStandard', true)
            ->call('deleteStandard')
            ->assertSet('showDeleteStandard', false)
            ->assertSet('statusMessage', 'Standard deleted.');

        $this->assertDatabaseMissing('inventinspectitem', [
            'itemid' => '000-228',
            'inspecttype' => 'STD',
            'inspectitem' => 'A',
        ]);
    }

    public function test_duplicate_standard_is_rejected(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        Livewire::actingAs($checker)
            ->test(ItemDetail::class, ['itemid' => '000-228'])
            ->call('openStandardCreate', 'STD')
            ->set('standardItem', 'A')
            ->set('standardValue', '10')
            ->set('tolerancePlus', '0')
            ->set('toleranceMinus', '0')
            ->call('saveStandard')
            ->assertHasErrors('standardItem');
    }

    public function test_inspector_does_not_see_standard_management_actions(): void
    {
        $inspector = $this->makeUser();

        $this->actingAs($inspector)
            ->get('/items/000-228')
            ->assertOk()
            ->assertDontSee('openStandardCreate')
            ->assertDontSee('openStandardEdit')
            ->assertDontSee('confirmStandardDelete');
    }
}
