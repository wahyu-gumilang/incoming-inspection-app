<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
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
            ->assertSee('Budi Santoso');
    }
}
