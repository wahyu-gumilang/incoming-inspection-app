<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Domain\User\Role;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UserRepository
{
    /**
     * @return array{total: int, active: int, inactive: int, roles: array<string, int>}
     */
    public function stats(): array
    {
        return [
            'total' => User::query()->count(),
            'active' => User::query()->where('active', true)->count(),
            'inactive' => User::query()->where('active', false)->count(),
            'roles' => User::query()
                ->selectRaw('role, count(*) as aggregate')
                ->groupBy('role')
                ->pluck('aggregate', 'role')
                ->all(),
        ];
    }

    public function paginate(
        string $search = '',
        string $role = '',
        string $status = '',
        int $perPage = 15,
    ): LengthAwarePaginator {
        $search = trim($search);

        return User::query()
            ->select([
                'userid',
                'username',
                'fullname',
                'email',
                'role',
                'active',
                'must_change_password',
                'avatar_path',
                'last_login_at',
                'created_at',
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $like = '%'.$search.'%';

                $query->where(function ($query) use ($like): void {
                    $query->where('username', 'like', $like)
                        ->orWhere('fullname', 'like', $like)
                        ->orWhere('email', 'like', $like);
                });
            })
            ->when(in_array($role, Role::all(), true), fn ($query) => $query->where('role', $role))
            ->when($status === 'active', fn ($query) => $query->where('active', true))
            ->when($status === 'inactive', fn ($query) => $query->where('active', false))
            ->orderByRaw(
                'CASE role WHEN ? THEN 0 WHEN ? THEN 1 ELSE 2 END',
                [Role::ADMIN, Role::CHECKER],
            )
            ->orderBy('fullname')
            ->paginate($perPage);
    }
}
