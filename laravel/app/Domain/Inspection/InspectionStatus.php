<?php

declare(strict_types=1);

namespace App\Domain\Inspection;

final class InspectionStatus
{
    public const DRAFT = 'DRAFT';

    public const SUBMITTED = 'SUBMITTED';

    public const CHECKED = 'CHECKED';

    public const RETURNED = 'RETURNED';

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return [self::DRAFT, self::SUBMITTED, self::CHECKED, self::RETURNED];
    }

    public static function normalize(?string $status): string
    {
        $status = strtoupper(trim((string) $status));

        return $status !== '' ? $status : self::DRAFT;
    }

    public static function label(string $status): string
    {
        $status = self::normalize($status);

        return match ($status) {
            self::SUBMITTED => 'Submitted',
            self::CHECKED => 'Checked',
            self::RETURNED => 'Returned',
            self::DRAFT => 'Draft',
            default => ctype_digit($status) ? 'Legacy' : ucfirst(strtolower($status)),
        };
    }

    public static function badgeVariant(string $status): string
    {
        return match (self::normalize($status)) {
            self::CHECKED => 'success',
            self::SUBMITTED => 'warning',
            self::RETURNED => 'danger',
            default => 'info',
        };
    }

    public static function isEditable(string $status): bool
    {
        return in_array(self::normalize($status), [self::DRAFT, self::RETURNED], true);
    }
}
