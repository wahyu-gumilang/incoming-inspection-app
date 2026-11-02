<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Livewire\Inspections\InspectionForm;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Livewire\Livewire;
use Tests\TestCase;

class AqlPageTest extends TestCase
{
    use DatabaseTransactions;

    public function test_signed_in_user_sees_the_aql_input_form(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user)
            ->get('/aql')
            ->assertOk()
            ->assertSee('AQL Table')
            ->assertSee('Delivery and AQL')
            ->assertSee('Dimensions')
            ->assertSee('Save inspection')
            ->assertSee('Sample size')
            ->assertSee('Judgment');
    }

    public function test_aql_uses_rich_comboboxes_and_consistent_option_values(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user)
            ->get('/aql')
            ->assertOk()
            ->assertSee('ui-combobox', false)
            ->assertSee('Choose an item...')
            ->assertSee('aria-controls="inspection-item-panel"', false)
            ->assertSee('aria-label="Inspection category for delivery 1"', false)
            ->assertSee('N — Normal')
            ->assertSee('X — Rejected');

        Livewire::actingAs($user)
            ->test(InspectionForm::class)
            ->call('toggleSelect', 'item')
            ->assertSet('openSelect', 'item')
            ->assertSee('data-value="000-228"', false)
            ->assertSee('ui-combobox-option-divider', false)
            ->assertSee('selectItem($event.currentTarget.dataset.value)', false)
            ->assertSee('Handle Rhino Prima')
            ->call('selectItem', '000-228')
            ->assertSet('itemid', '000-228')
            ->assertSet('openSelect', null)
            ->call('toggleSelect', 'supplier')
            ->assertSee('data-value="V-0001"', false)
            ->call('selectSupplier', 'V-0001')
            ->assertSet('accountnum', 'V-0001')
            ->call('toggleSelect', 'plan')
            ->assertSee('data-value="1"', false)
            ->assertSee('Current practice')
            ->call('selectPlan', '1')
            ->assertSet('planid', 1)
            ->assertSet('openSelect', null);
    }

    public function test_guest_is_redirected_from_the_aql_page(): void
    {
        $this->get('/aql')->assertRedirect('/login');
    }
}
