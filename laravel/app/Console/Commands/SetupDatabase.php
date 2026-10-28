<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Database\SqlScript;
use Illuminate\Console\Command;
use Illuminate\Database\Connection;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

final class SetupDatabase extends Command
{
    protected $signature = 'db:setup
        {--database= : The Laravel connection to set up}
        {--fresh : Drop and recreate the target database first}
        {--seed : Load the test fixtures (requires --fresh and a test database)}
        {--status : Show applied and pending migrations without changing anything}
        {--force : Allow a database whose name does not end with _test}';

    protected $description = 'Load the legacy baseline, apply the SQL migrations and optionally seed fixtures';

    public function handle(): int
    {
        $connectionName = (string) ($this->option('database') ?: config('database.default'));
        $config = config("database.connections.{$connectionName}");

        if (! is_array($config) || ! in_array($config['driver'] ?? null, ['mysql', 'mariadb'], true)) {
            $this->components->error("Connection \"{$connectionName}\" is not a MySQL or MariaDB connection.");

            return self::FAILURE;
        }

        $database = (string) ($config['database'] ?? '');

        if (preg_match('/^[A-Za-z0-9_]+$/', $database) !== 1) {
            $this->components->error('The database name may only contain letters, digits and underscores.');

            return self::FAILURE;
        }

        $migrations = $this->migrationFiles();

        if ($migrations === []) {
            $this->components->error('No SQL migrations were found in database/sql/migrations.');

            return self::FAILURE;
        }

        if ($this->option('status')) {
            return $this->showStatus($connectionName, $database, $migrations);
        }

        $isTestDatabase = str_ends_with($database, '_test');

        if (! $isTestDatabase && ! $this->option('force')) {
            $this->components->error("Refusing to change \"{$database}\" because its name does not end with _test.");
            $this->components->warn('Back up the database first, then run the command again with --force.');

            return self::FAILURE;
        }

        if ($this->option('seed') && ! $isTestDatabase) {
            $this->components->error('The test fixtures can only be loaded into a database whose name ends with _test.');

            return self::FAILURE;
        }

        if ($this->option('seed') && ! $this->option('fresh')) {
            $this->components->error('--seed requires --fresh so the fixtures are not loaded twice.');

            return self::FAILURE;
        }

        try {
            $this->line("Connection: {$connectionName}");
            $this->line("Database:   {$database}");

            $this->prepareDatabase($connectionName, $database);
            $connection = DB::connection($connectionName);

            if ($this->tableCount($connection) === 0) {
                $this->components->info('Loading baseline.sql');
                $this->runFile($connection, database_path('sql/baseline.sql'));
            } elseif (! $connection->getSchemaBuilder()->hasTable('schema_migrations')) {
                throw new RuntimeException(
                    'The database is not empty but has no schema_migrations table. '.
                    'Run with --fresh on a test database, or inspect the schema before migrating.'
                );
            }

            $this->ensureMigrationsTable($connection);
            $this->runMigrations($connection, $migrations);

            if ($this->option('seed')) {
                $this->components->info('Loading test fixtures');
                $this->runFile($connection, database_path('sql/fixtures/test-fixtures.sql'));
            }

            $this->components->info("Database \"{$database}\" is ready.");

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->components->error($exception->getMessage());

            return self::FAILURE;
        }
    }

    /**
     * @return list<string>
     */
    private function migrationFiles(): array
    {
        $files = glob(database_path('sql/migrations/*.sql')) ?: [];
        $names = [];

        foreach ($files as $file) {
            $name = basename($file);

            if (preg_match('/^\d{3}_[a-z0-9_]+\.sql$/', $name) === 1) {
                $names[] = $name;
            }
        }

        sort($names, SORT_STRING);

        return $names;
    }

    /**
     * @param  list<string>  $migrations
     */
    private function showStatus(string $connectionName, string $database, array $migrations): int
    {
        try {
            $server = $this->serverConnection($connectionName);

            if (! $this->databaseExists($server, $database)) {
                $this->components->warn("Database \"{$database}\" does not exist. Run db:setup without --status.");

                return self::SUCCESS;
            }

            $connection = DB::connection($connectionName);
            $applied = $connection->getSchemaBuilder()->hasTable('schema_migrations')
                ? $connection->table('schema_migrations')->pluck('name')->all()
                : [];

            $pending = array_values(array_diff($migrations, $applied));

            $this->line("Database: {$database}");
            $this->line('Applied:  '.count($applied));
            $this->line('Pending:  '.count($pending));

            foreach ($pending as $name) {
                $this->line("  {$name}");
            }

            if ($pending === []) {
                $this->components->info('No pending migrations.');
            }

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->components->error($exception->getMessage());

            return self::FAILURE;
        }
    }

    private function prepareDatabase(string $connectionName, string $database): void
    {
        DB::purge($connectionName);
        $server = $this->serverConnection($connectionName);

        if ($this->option('fresh')) {
            $this->dropDatabase($server, $database);
        }

        if (! $this->databaseExists($server, $database)) {
            $this->line('Creating the database');
            $server->unprepared(
                sprintf('CREATE DATABASE `%s` CHARACTER SET utf8 COLLATE utf8_unicode_ci', $database)
            );
        }

        DB::purge($connectionName);
    }

    private function dropDatabase(Connection $server, string $database): void
    {
        $this->line('Dropping the database');

        try {
            $server->unprepared(sprintf('DROP DATABASE IF EXISTS `%s`', $database));
        } catch (QueryException $exception) {
            if ($this->tableCountForDatabase($server, $database) > 0) {
                throw new RuntimeException(
                    "Could not drop \"{$database}\": {$exception->getMessage()}",
                    0,
                    $exception,
                );
            }

            // MariaDB may keep an empty schema registered after a blocked drop.
            $server->unprepared(sprintf('DROP DATABASE IF EXISTS `%s`', $database));
        }
    }

    private function ensureMigrationsTable(Connection $connection): void
    {
        $connection->unprepared(
            'CREATE TABLE IF NOT EXISTS schema_migrations (
                name varchar(255) NOT NULL,
                applied_at datetime NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci'
        );
    }

    /**
     * @param  list<string>  $migrations
     */
    private function runMigrations(Connection $connection, array $migrations): void
    {
        $applied = $connection->table('schema_migrations')->pluck('name')->all();
        $pending = array_values(array_diff($migrations, $applied));

        if ($pending === []) {
            $this->components->info('No pending migrations.');

            return;
        }

        $this->line('Applying '.count($pending).' migration(s)');

        foreach ($pending as $name) {
            $this->line("  {$name}");
            $this->runFile($connection, database_path("sql/migrations/{$name}"));
            $connection->table('schema_migrations')->insert(['name' => $name]);
        }
    }

    private function runFile(Connection $connection, string $path): void
    {
        $sql = file_get_contents($path);

        if ($sql === false) {
            throw new RuntimeException("Could not read {$path}.");
        }

        foreach (SqlScript::statements($sql) as $position => $statement) {
            try {
                $connection->unprepared($statement);
            } catch (QueryException $exception) {
                throw new RuntimeException(
                    sprintf(
                        'Failed in %s at statement %d: %s',
                        basename($path),
                        $position + 1,
                        $exception->getMessage(),
                    ),
                    0,
                    $exception,
                );
            }
        }
    }

    private function serverConnection(string $connectionName): Connection
    {
        $config = config("database.connections.{$connectionName}");
        $config['database'] = null;
        $config['url'] = null;

        config(['database.connections.db_setup_server' => $config]);
        DB::purge('db_setup_server');

        return DB::connection('db_setup_server');
    }

    private function databaseExists(Connection $server, string $database): bool
    {
        $row = $server->selectOne(
            'SELECT COUNT(*) AS aggregate FROM information_schema.schemata WHERE schema_name = ?',
            [$database],
        );

        return (int) ($row->aggregate ?? 0) > 0;
    }

    private function tableCount(Connection $connection): int
    {
        $row = $connection->selectOne(
            'SELECT COUNT(*) AS aggregate FROM information_schema.tables WHERE table_schema = DATABASE()',
        );

        return (int) ($row->aggregate ?? 0);
    }

    private function tableCountForDatabase(Connection $server, string $database): int
    {
        $row = $server->selectOne(
            'SELECT COUNT(*) AS aggregate FROM information_schema.tables WHERE table_schema = ?',
            [$database],
        );

        return (int) ($row->aggregate ?? 0);
    }
}
