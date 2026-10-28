<?php

declare(strict_types=1);

namespace App\Database;

/**
 * Splits a SQL file into single statements.
 *
 * MariaDB commits DDL immediately, so each statement is executed on its own to
 * report the exact failing statement. The splitter understands line comments,
 * block comments and quoted strings or identifiers, including escaped and
 * doubled quote characters.
 */
final class SqlScript
{
    /**
     * @return list<string>
     */
    public static function statements(string $sql): array
    {
        $statements = [];
        $buffer = '';
        $quote = null;
        $length = strlen($sql);

        for ($index = 0; $index < $length; $index++) {
            $char = $sql[$index];

            if ($quote !== null) {
                $buffer .= $char;

                if ($char === '\\' && $quote !== '`' && $index + 1 < $length) {
                    $buffer .= $sql[++$index];

                    continue;
                }

                if ($char !== $quote) {
                    continue;
                }

                if ($index + 1 < $length && $sql[$index + 1] === $quote) {
                    $buffer .= $sql[++$index];

                    continue;
                }

                $quote = null;

                continue;
            }

            if ($char === "'" || $char === '"' || $char === '`') {
                $quote = $char;
                $buffer .= $char;

                continue;
            }

            if ($char === '#' || ($char === '-' && self::isLineComment($sql, $index))) {
                while ($index < $length && $sql[$index] !== "\n") {
                    $index++;
                }

                $buffer .= "\n";

                continue;
            }

            if ($char === '/' && $index + 1 < $length && $sql[$index + 1] === '*') {
                $end = strpos($sql, '*/', $index + 2);
                $index = $end === false ? $length : $end + 1;
                $buffer .= ' ';

                continue;
            }

            if ($char === ';') {
                self::push($statements, $buffer);
                $buffer = '';

                continue;
            }

            $buffer .= $char;
        }

        self::push($statements, $buffer);

        return $statements;
    }

    /**
     * @param  list<string>  $statements
     */
    private static function push(array &$statements, string $buffer): void
    {
        $statement = trim($buffer);

        if ($statement !== '') {
            $statements[] = $statement;
        }
    }

    private static function isLineComment(string $sql, int $index): bool
    {
        if (($sql[$index + 1] ?? '') !== '-') {
            return false;
        }

        $next = $sql[$index + 2] ?? '';

        return $next === '' || ctype_space($next);
    }
}
