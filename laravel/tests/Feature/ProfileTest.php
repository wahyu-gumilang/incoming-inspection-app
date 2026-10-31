<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use DatabaseTransactions;

    public function test_user_can_update_name_email_and_theme(): void
    {
        $user = $this->makeUser(['fullname' => 'Budi Santoso']);

        $response = $this->actingAs($user)->put('/profile', [
            'fullname' => 'Budi Santoso Updated',
            'email' => 'budi@example.com',
            'theme' => 'dark',
        ]);

        $response->assertRedirect(route('profile.edit'));
        $response->assertSessionHas('status', 'Your profile has been updated.');
        $this->assertDatabaseHas('usertable', [
            'userid' => $user->userid,
            'fullname' => 'Budi Santoso Updated',
            'email' => 'budi@example.com',
            'theme' => 'dark',
        ]);
    }

    public function test_fullname_is_required(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user)
            ->from('/profile')
            ->put('/profile', [
                'fullname' => '',
                'email' => 'budi@example.com',
                'theme' => 'light',
            ])
            ->assertRedirect('/profile')
            ->assertSessionHasErrors('fullname');
    }

    public function test_profile_page_is_visible_to_signed_in_user(): void
    {
        $user = $this->makeUser(['fullname' => 'Budi Santoso']);

        $this->actingAs($user)
            ->get('/profile')
            ->assertOk()
            ->assertSee('Profile settings')
            ->assertSee('Budi Santoso');
    }
}
