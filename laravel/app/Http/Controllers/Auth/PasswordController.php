<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\UpdatePasswordRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

class PasswordController extends Controller
{
    public function show(): View
    {
        return view('auth.change-password');
    }

    public function update(UpdatePasswordRequest $request): RedirectResponse
    {
        $user = $request->user();

        $user->forceFill([
            'password_hash' => Hash::make($request->string('password')->toString()),
            'must_change_password' => false,
        ])->save();

        $request->session()->regenerate();

        return redirect()
            ->route('dashboard')
            ->with('status', 'Your password has been updated.');
    }
}
