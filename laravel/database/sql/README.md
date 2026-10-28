# SQL sources

These files are the SQL used by `php85 artisan db:setup`.

- `baseline.sql` is the imported schema before any migration.
- `migrations/` holds the numbered migrations in order.
- `fixtures/test-fixtures.sql` holds the data for csi_db_test.

They are copies of the approved files in `backend/db`. The legacy backend still uses
its own copies until cutover, so add a new migration to both directories.

Never edit a migration that has already been applied. Add the next number instead.
