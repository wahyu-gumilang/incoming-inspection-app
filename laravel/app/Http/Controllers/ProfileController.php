<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProfileRequest;
use Illuminate\Http\RedirectResponse;
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
        $data['email'] = filled($data['email'] ?? null) ? $data['email'] : null;

        $request->user()->forceFill($data)->save();

        return redirect()
            ->route('profile.edit')
            ->with('status', 'Your profile has been updated.');
    }
}
