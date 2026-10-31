<?php

declare(strict_types=1);

namespace App\Hashing;

use Illuminate\Hashing\BcryptHasher;

/**
 * Accepts the legacy bcrypt hashes written by bcryptjs ($2b$).
 *
 * PHP 8.5 reports $2b$ as an unknown algorithm even though password_verify()
 * accepts it. Laravel's algorithm check would reject those hashes. Normalizing
 * the prefix keeps the check enabled while supporting existing users. The hash
 * is rehashed to Laravel's $2y$ format on the next successful login.
 */
class LegacyBcryptHasher extends BcryptHasher
{
    public function check(#[\SensitiveParameter] $value, $hashedValue, array $options = [])
    {
        return parent::check($value, $this->normalize($hashedValue), $options);
    }

    public function needsRehash($hashedValue, array $options = [])
    {
        if (is_string($hashedValue) && str_starts_with($hashedValue, '$2b$')) {
            return true;
        }

        return parent::needsRehash($hashedValue, $options);
    }

    private function normalize(mixed $hashedValue): mixed
    {
        if (is_string($hashedValue) && str_starts_with($hashedValue, '$2b$')) {
            return '$2y$'.substr($hashedValue, 4);
        }

        return $hashedValue;
    }
}
