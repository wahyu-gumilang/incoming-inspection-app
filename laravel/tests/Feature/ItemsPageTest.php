<?php

namespace Tests\Feature;

use App\Domain\User\Role;
use App\Livewire\Items\ItemDetail;
use App\Livewire\Items\ItemList;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Livewire\Livewire;
use Tests\TestCase;

class ItemsPageTest extends TestCase
{
    use DatabaseTransactions;

    public function test_signed_in_user_can_search_legacy_items(): void
    {
        $user = $this->makeUser();

        $response = $this->actingAs($user)->get('/items');

        $response->assertOk();
        $response->assertSee('000-228');
        $response->assertSee('Handle Rhino Prima');
    }

    public function test_items_page_uses_the_search_query_from_the_navbar(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user)
            ->get('/items?search=000-228')
            ->assertOk()
            ->assertSee('Handle Rhino Prima')
            ->assertDontSee('Steel Fibre 0.4 x 16 mm');
    }

    public function test_guest_is_redirected_from_the_items_page(): void
    {
        $this->get('/items')->assertRedirect('/login');
    }

    public function test_signed_in_user_can_view_the_item_detail_and_grouped_standards(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user)
            ->get('/items/000-228')
            ->assertOk()
            ->assertSee('Handle Rhino Prima')
            ->assertSee('000-228')
            ->assertSee('STD')
            ->assertSee('Certificate')
            ->assertSee('Visual')
            ->assertSee('Fitting')
            ->assertSee('12.10')
            ->assertSee('12.90');
    }

    public function test_unknown_item_returns_not_found(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user)
            ->get('/items/does-not-exist')
            ->assertNotFound();
    }

    public function test_checker_can_create_an_item(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        Livewire::actingAs($checker)
            ->test(ItemList::class)
            ->call('openCreate')
            ->assertSet('showCreate', true)
            ->set('itemid', 'TEST-ITEM-001')
            ->set('name', 'Test Item')
            ->call('createItem')
            ->assertHasNoErrors()
            ->assertSet('showCreate', false)
            ->assertRedirect(route('items.show', ['itemid' => 'TEST-ITEM-001']));

        $this->assertDatabaseHas('inventtable', [
            'itemid' => 'TEST-ITEM-001',
            'name' => 'Test Item',
        ]);
    }

    public function test_inspector_does_not_see_the_add_item_action(): void
    {
        $inspector = $this->makeUser();

        $this->actingAs($inspector)
            ->get('/items')
            ->assertOk()
            ->assertSee('View only')
            ->assertDontSee('Add item');
    }

    public function test_checker_can_rename_an_item(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        Livewire::actingAs($checker)
            ->test(ItemDetail::class, ['itemid' => '000-228'])
            ->call('openEdit')
            ->assertSet('showEdit', true)
            ->set('name', 'Handle Rhino Prima Updated')
            ->call('save')
            ->assertHasNoErrors()
            ->assertSet('showEdit', false)
            ->assertSet('statusMessage', 'Item name updated.');

        $this->assertDatabaseHas('inventtable', [
            'itemid' => '000-228',
            'name' => 'Handle Rhino Prima Updated',
        ]);
    }

    public function test_item_standard_filter_state_is_synchronized(): void
    {
        $user = $this->makeUser();

        Livewire::actingAs($user)
            ->test(ItemList::class)
            ->assertSet('standards', 'all')
            ->call('selectStandards', 'with')
            ->assertSet('standards', 'with')
            ->call('selectStandards', 'without')
            ->assertSet('standards', 'without')
            ->call('selectStandards', 'all')
            ->assertSet('standards', 'all');
    }
}
