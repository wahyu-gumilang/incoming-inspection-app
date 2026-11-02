<?php

declare(strict_types=1);

namespace App\Services;

class InspectionCalculator
{
    public function standardStatus(mixed $actual, mixed $standard, mixed $tolerancePlus, mixed $toleranceMinus): ?int
    {
        if ($actual === null || $actual === '' || ! is_numeric($actual) || ! is_numeric($standard)) {
            return null;
        }

        $value = (float) $actual;
        $base = (float) $standard;
        $minimum = $base - abs((float) $toleranceMinus);
        $maximum = $base + abs((float) $tolerancePlus);

        return $value >= $minimum && $value <= $maximum ? 1 : 0;
    }

    public function suggestedJudgment(int $notgood, int $accept, int $reject): int
    {
        if ($notgood >= $reject) {
            return 2;
        }

        return $notgood <= $accept ? 1 : 0;
    }

    public function judgmentLabel(int $judgment): string
    {
        return match ($judgment) {
            1 => 'O',
            2 => 'X',
            3 => 'C',
            default => '',
        };
    }

    public function categoryLabel(int $category): string
    {
        return match ($category) {
            1 => 'N',
            2 => 'R',
            3 => 'T',
            default => '100%',
        };
    }
}
