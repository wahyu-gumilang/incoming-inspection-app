<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use DomainException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Hash;

class UserService
{
    /**
     * @param  array{username: string, fullname: string, email?: string|null, role: string}  $data
     * @return array{0: User, 1: string}
     */
    public function create(array $data): array
    {
        $password = $this->temporaryPassword();

        try {
            $user = User::create([
                'username' => trim($data['username']),
                'fullname' => trim($data['fullname']),
                'email' => filled($data['email'] ?? null) ? $data['email'] : null,
                'role' => $data['role'],
                'password_hash' => Hash::make($password),
                'active' => true,
                'must_change_password' => true,
                'theme' => 'light',
            ]);
        } catch (QueryException $exception) {
            if ((string) $exception->getCode() === '23000') {
                throw new DomainException('That username is already taken.', 0, $exception);
            }

            throw $exception;
        }

        return [$user, $password];
    }

    /**
     * @param  array{fullname: string, email?: string|null, role: string}  $data
     */
    public function update(User $user, array $data, User $actor): void
    {
        if ($user->is($actor) && $data['role'] !== $user->role) {
            throw new DomainException('You cannot change your own role.');
        }

        $user->forceFill([
            'fullname' => trim($data['fullname']),
            'email' => filled($data['email'] ?? null) ? $data['email'] : null,
            'role' => $data['role'],
        ])->save();
    }

    public function setActive(User $user, bool $active, User $actor): void
    {
        if ($user->is($actor) && ! $active) {
            throw new DomainException('You cannot deactivate your own account.');
        }

        $user->forceFill(['active' => $active])->save();
    }

    public function resetPassword(User $user, User $actor): string
    {
        if ($user->is($actor)) {
            throw new DomainException('Use Profile settings to change your own password.');
        }

        $password = $this->temporaryPassword();

        $user->forceFill([
            'password_hash' => Hash::make($password),
            'must_change_password' => true,
        ])->save();

        return $password;
    }

    private function temporaryPassword(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        $length = strlen($alphabet);
        $characters = '';

        for ($index = 0; $index < 10; $index++) {
            $characters .= $alphabet[random_int(0, $length - 1)];
        }

        return substr($characters, 0, 5).'-'.substr($characters, 5);
    }
}
