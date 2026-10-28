<?php

declare(strict_types=1);

namespace Tests\Unit\Database;

use App\Database\SqlScript;
use PHPUnit\Framework\TestCase;

class SqlScriptTest extends TestCase
{
    public function test_it_splits_statements_on_semicolons(): void
    {
        $statements = SqlScript::statements("SELECT 1;\nSELECT 2;\n");

        $this->assertSame(['SELECT 1', 'SELECT 2'], $statements);
    }

    public function test_it_keeps_semicolons_inside_quoted_values(): void
    {
        $sql = "INSERT INTO t (a, b) VALUES ('a;b', 'it''s; fine');";

        $this->assertSame(
            ["INSERT INTO t (a, b) VALUES ('a;b', 'it''s; fine')"],
            SqlScript::statements($sql),
        );
    }

    public function test_it_keeps_semicolons_inside_quoted_identifiers(): void
    {
        $sql = 'CREATE TABLE `odd;name` (`value` int);';

        $this->assertSame(
            ['CREATE TABLE `odd;name` (`value` int)'],
            SqlScript::statements($sql),
        );
    }

    public function test_it_removes_line_and_block_comments(): void
    {
        $sql = <<<'SQL'
            -- leading comment
            SELECT 1; # trailing comment
            /* block
               comment */
            SELECT 2;
            SQL;

        $this->assertSame(['SELECT 1', 'SELECT 2'], SqlScript::statements($sql));
    }

    public function test_it_ignores_an_empty_file(): void
    {
        $this->assertSame([], SqlScript::statements("  \n-- nothing here\n"));
    }

    public function test_it_handles_escaped_quotes(): void
    {
        $sql = "SELECT 'it\\'s; here';";

        $this->assertSame(["SELECT 'it\\'s; here'"], SqlScript::statements($sql));
    }
}
