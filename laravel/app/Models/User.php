<?php

declare(strict_types=1);

namespace App\Models;

use App\Domain\User\Role;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    protected $table = 'usertable';

    protected $primaryKey = 'userid';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'username',
        'fullname',
        'email',
        'role',
        'password_hash',
        'avatar_path',
        'active',
        'must_change_password',
        'theme',
        'last_login_at',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = ['password_hash', 'remember_token'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'must_change_password' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }

    public function hasRole(string ...$roles): bool
    {
        return in_array($this->role, $roles, true);
    }

    public function isAdmin(): bool
    {
        return $this->role === Role::ADMIN;
    }

    public function isChecker(): bool
    {
        return $this->hasRole(Role::CHECKER, Role::ADMIN);
    }

    public function roleLabel(): string
    {
        return Role::label($this->role);
    }
}
