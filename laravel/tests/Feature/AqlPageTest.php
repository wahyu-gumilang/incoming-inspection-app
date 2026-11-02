<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
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

    public function test_guest_is_redirected_from_the_aql_page(): void
    {
        $this->get('/aql')->assertRedirect('/login');
    }
}
