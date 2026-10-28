<?php

declare(strict_types=1);

namespace Tests\Feature\Console;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Throwable;

class SetupDatabaseCommandTest extends TestCase
{
    private const CONNECTION = 'db_setup_test';

    private const DATABASE = 'csi_db_setup_test';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.connections.'.self::CONNECTION => array_merge(
                config('database.connections.mysql'),
                ['database' => self::DATABASE],
            ),
        ]);

        DB::purge(self::CONNECTION);
        $this->dropDatabase();
    }

    protected function tearDown(): void
    {
        $this->dropDatabase();
        DB::purge(self::CONNECTION);
        DB::purge('db_setup_server');

        parent::tearDown();
    }

    public function test_it_builds_a_test_database_from_the_baseline_migrations_and_fixtures(): void
    {
        $this->artisan('db:setup', [
            '--database' => self::CONNECTION,
            '--fresh' => true,
            '--seed' => true,
        ])->assertSuccessful();

        $connection = DB::connection(self::CONNECTION);

        $this->assertSame(15, $connection->table('schema_migrations')->count());
        $this->assertSame(3, $connection->table('inventtable')->count());
        $this->assertSame(6, $connection->table('usertable')->count());
        $this->assertTrue($connection->getSchemaBuilder()->hasTable('aqlplanrow'));
        $this->assertTrue($connection->getSchemaBuilder()->hasColumn('inspectline', 'tolerance_txt'));
        $this->assertTrue($connection->getSchemaBuilder()->hasColumn('inspecttable', 'samplesize1'));
        $this->assertTrue($connection->getSchemaBuilder()->hasColumn('inspecttable', 'inspectbyid'));
        $this->assertTrue($connection->getSchemaBuilder()->hasColumn('usertable', 'remember_token'));
        $this->assertTrue($connection->getSchemaBuilder()->hasColumn('usertable', 'avatar_path'));
    }

    public function test_a_second_run_has_no_pending_migrations(): void
    {
        $this->artisan('db:setup', [
            '--database' => self::CONNECTION,
            '--fresh' => true,
            '--seed' => true,
        ])->assertSuccessful();

        $this->artisan('db:setup', ['--database' => self::CONNECTION])
            ->expectsOutputToContain('No pending migrations.')
            ->assertSuccessful();
    }

    public function test_it_refuses_a_database_that_is_not_for_tests(): void
    {
        config([
            'database.connections.csi_guard' => array_merge(
                config('database.connections.mysql'),
                ['database' => 'csi_db'],
            ),
        ]);

        $this->artisan('db:setup', ['--database' => 'csi_guard'])
            ->expectsOutputToContain('Refusing to change "csi_db"')
            ->assertFailed();
    }

    public function test_it_refuses_to_seed_without_fresh(): void
    {
        $this->artisan('db:setup', [
            '--database' => self::CONNECTION,
            '--seed' => true,
        ])
            ->expectsOutputToContain('--seed requires --fresh')
            ->assertFailed();
    }

    private function dropDatabase(): void
    {
        $config = config('database.connections.mysql');
        $config['database'] = null;

        config(['database.connections.db_setup_test_server' => $config]);
        DB::purge('db_setup_test_server');

        try {
            DB::connection('db_setup_test_server')->unprepared(
                sprintf('DROP DATABASE IF EXISTS `%s`', self::DATABASE)
            );
        } catch (Throwable) {
            // A leftover schema must not hide the actual test result.
        }
    }
}
