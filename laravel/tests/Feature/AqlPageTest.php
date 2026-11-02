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
            ->assertDontSee('<select', false)
            ->assertSee('Choose an item...')
            ->assertSee('aria-controls="inspection-item-panel"', false)
            ->assertSee('inspection-category-1', false)
            ->assertSee('aria-label="Inspection category for delivery 1"', false);

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

    public function test_delivery_selects_use_the_shared_combobox_and_update_values(): void
    {
        $user = $this->makeUser();

        Livewire::actingAs($user)
            ->test(InspectionForm::class)
            ->set('itemid', '000-228')
            ->call('toggleSelect', 'category:1')
            ->assertSet('openSelect', 'category:1')
            ->assertSee('data-value="1"', false)
            ->assertSee('Normal')
            ->assertSee('ui-combobox-option-divider', false)
            ->assertSee('selectCategory($event.currentTarget.dataset.value, 1)', false)
            ->call('selectCategory', '1', 1)
            ->assertSet('deliveries.1.category', '1')
            ->assertSet('openSelect', null)
            ->call('toggleSelect', 'judgment:1')
            ->assertSee('Accepted')
            ->call('selectJudgment', '1', 1)
            ->assertSet('deliveries.1.judgment', '1')
            ->call('toggleSelect', 'status:0:1')
            ->assertSee('OK')
            ->assertSee('selectOtherStatus($event.currentTarget.dataset.value, 0, 1)', false)
            ->call('selectOtherStatus', '1', 0, 1)
            ->assertSet('otherLines.0.statuses.1', '1')
            ->assertSet('openSelect', null);
    }

    public function test_guest_is_redirected_from_the_aql_page(): void
    {
        $this->get('/aql')->assertRedirect('/login');
    }
}
