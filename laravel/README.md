# Incoming Inspection QC - Laravel application

This directory contains the PHP application for the Incoming Inspection QC System.

Read the repository roadmap in ../PLAN.md and the coding guide in ../CLAUDE.md before making
changes.

## Requirements

- PHP 8.5
- Composer
- MariaDB 10.4 or MySQL
- Node.js only if the frontend assets need to be rebuilt

## Local setup

1. Copy .env.example to .env.
2. Set the database connection to the local csi_db database.
3. Run composer install.
4. Run php85 artisan key:generate.
5. Run ./serve to start the application.
6. Open /login. The item list at /items requires a signed-in user.

## Local commands

| Command | Purpose |
|---|---|
| ./serve | Start the application. |
| php85 -S 127.0.0.1:8000 -t public server.php | Start without the serve script. |
| php85 vendor/bin/phpunit | Run the test suite. |
| php85 vendor/bin/pint | Format the PHP code. |
| php85 vendor/bin/pint --test | Check formatting without writing. |

Do not use php artisan serve or php artisan test with the portable PHP runtime. Laravel
re-executes PHP_BINARY and the child process loses the portable library path, php.ini and
extensions.

## Structure

| Path | Purpose |
|---|---|
| app/Domain | Pure business rules. |
| app/Repositories | Database access for legacy and composite-key tables. |
| app/Services or app/Actions | Use cases and transactions. |
| app/Http | Controllers, requests and middleware. |
| resources/views | Blade views and Livewire components. |
| database/sql | Legacy baseline, SQL migrations and fixtures. |
| tests/Unit | Pure business rule tests. |
| tests/Feature | Page and database tests. |

## Status

The application is in the migration phase. Login, logout, session authentication, roles and
the application shell are in place. The item list is the first data screen. Master data,
inspections and reporting are still in progress.
