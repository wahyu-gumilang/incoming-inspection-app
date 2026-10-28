<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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

    public function test_user_can_update_the_theme_from_the_navbar(): void
    {
        $user = $this->makeUser(['theme' => 'light']);

        $this->actingAs($user)
            ->patchJson(route('profile.theme'), ['theme' => 'dark'])
            ->assertOk()
            ->assertJson(['theme' => 'dark']);

        $this->assertSame('dark', $user->fresh()->theme);
    }

    public function test_theme_update_rejects_an_unknown_theme(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user)
            ->patchJson(route('profile.theme'), ['theme' => 'neon'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('theme');
    }

    public function test_theme_update_redirects_a_normal_form_submit(): void
    {
        $user = $this->makeUser(['theme' => 'light']);

        $this->actingAs($user)
            ->from('/profile')
            ->patch(route('profile.theme'), ['theme' => 'system'])
            ->assertRedirect('/profile');

        $this->assertSame('system', $user->fresh()->theme);
    }

    public function test_user_can_upload_a_profile_photo(): void
    {
        Storage::fake('public');

        $user = $this->makeUser();

        $response = $this->actingAs($user)->put('/profile', [
            'fullname' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'theme' => 'light',
            'avatar' => $this->pngUpload(),
        ]);

        $response->assertRedirect(route('profile.edit'))->assertSessionHas('status');

        $user->refresh();

        $this->assertNotNull($user->avatar_path);
        Storage::disk('public')->assertExists($user->avatar_path);
    }

    public function test_user_can_remove_the_profile_photo(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('avatars/old.png', 'old');

        $user = $this->makeUser(['avatar_path' => 'avatars/old.png']);

        $response = $this->actingAs($user)->put('/profile', [
            'fullname' => 'Budi Santoso',
            'email' => null,
            'theme' => 'light',
            'remove_avatar' => '1',
        ]);

        $response->assertRedirect(route('profile.edit'));

        $this->assertNull($user->fresh()->avatar_path);
        Storage::disk('public')->assertMissing('avatars/old.png');
    }

    public function test_avatar_must_be_an_image(): void
    {
        Storage::fake('public');

        $user = $this->makeUser();

        $response = $this->actingAs($user)
            ->from('/profile')
            ->put('/profile', [
                'fullname' => 'Budi Santoso',
                'email' => null,
                'theme' => 'light',
                'avatar' => UploadedFile::fake()->create('notes.txt', 10, 'text/plain'),
            ]);

        $response->assertRedirect('/profile')->assertSessionHasErrors('avatar');

        $this->assertNull($user->fresh()->avatar_path);
    }

    public function test_uploaded_avatar_is_served_by_the_application(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('avatars/test.png', $this->pngContents());

        $user = $this->makeUser(['avatar_path' => 'avatars/test.png']);

        $this->actingAs($user)
            ->get(route('avatars.show', ['filename' => 'test.png']))
            ->assertOk()
            ->assertHeader('content-type', 'image/png');
    }

    private function pngUpload(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('avatar.png', $this->pngContents());
    }

    private function pngContents(): string
    {
        return (string) base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII='
        );
    }
}
