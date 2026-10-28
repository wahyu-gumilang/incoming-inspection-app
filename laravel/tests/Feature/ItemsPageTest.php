<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
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
}
