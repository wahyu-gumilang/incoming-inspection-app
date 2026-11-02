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

    public function test_aql_selects_use_shared_markup_and_real_option_values(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user)
            ->get('/aql')
            ->assertOk()
            ->assertSee('ui-select-native', false)
            ->assertSee('<option value="000-228">000-228 — Handle Rhino Prima</option>', false)
            ->assertSee('<option value="V-0001">V-0001 — PT Sinar Logam Abadi</option>', false)
            ->assertSee('<option value="1">N — Normal</option>', false)
            ->assertSee('<option value="2">X — Rejected</option>', false)
            ->assertSee('aria-label="Inspection category for delivery 1"', false);
    }

    public function test_guest_is_redirected_from_the_aql_page(): void
    {
        $this->get('/aql')->assertRedirect('/login');
    }
}
