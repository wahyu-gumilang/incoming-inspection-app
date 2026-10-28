<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProfileRequest;
use App\Http\Requests\UpdateThemeRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\View\View;

class ProfileController extends Controller
{
    public function edit(): View
    {
        return view('profile.edit');
    }

    public function update(UpdateProfileRequest $request): RedirectResponse
    {
        $data = $request->validated();
        unset($data['avatar'], $data['remove_avatar']);
        $data['email'] = filled($data['email'] ?? null) ? $data['email'] : null;

        $user = $request->user();
        $oldAvatar = $user->avatar_path;

        if ($request->hasFile('avatar')) {
            $data['avatar_path'] = $request->file('avatar')->store('avatars', 'public');
        } elseif ($request->boolean('remove_avatar')) {
            $data['avatar_path'] = null;
        }

        $user->forceFill($data)->save();

        if (array_key_exists('avatar_path', $data) && $oldAvatar && $oldAvatar !== $data['avatar_path']) {
            Storage::disk('public')->delete($oldAvatar);
        }

        return redirect()
            ->route('profile.edit')
            ->with('status', 'Your profile has been updated.');
    }

    public function updateTheme(UpdateThemeRequest $request): JsonResponse|RedirectResponse
    {
        $theme = (string) $request->validated('theme');

        $request->user()->forceFill(['theme' => $theme])->save();

        if ($request->expectsJson()) {
            return response()->json(['theme' => $theme]);
        }

        return redirect()->back()->with('status', 'Your theme preference has been updated.');
    }
}
