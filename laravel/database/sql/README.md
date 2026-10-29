# SQL sources

These files are the canonical SQL used by `php85 artisan db:setup`.

- `baseline.sql` is the imported schema before any migration.
- `migrations/` holds the numbered migrations in order.
- `fixtures/test-fixtures.sql` holds the data for `csi_db_test`.

Never edit a migration that has already been applied. Add the next number instead.
