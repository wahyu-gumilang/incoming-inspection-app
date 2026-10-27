<?php

declare(strict_types=1);

namespace App\Domain\User;

final class Role
{
    public const INSPECTOR = 'INSPECTOR';

    public const CHECKER = 'CHECKER';

    public const ADMIN = 'ADMIN';

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return [self::INSPECTOR, self::CHECKER, self::ADMIN];
    }

    public static function label(string $role): string
    {
        return match ($role) {
            self::INSPECTOR => 'Inspector',
            self::CHECKER => 'Checker',
            self::ADMIN => 'Admin',
            default => $role,
        };
    }
}
