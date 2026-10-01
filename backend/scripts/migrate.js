const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');
const FILE_PATTERN = /^\d{3}_[a-z0-9_]+\.sql$/;

function migrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => FILE_PATTERN.test(file))
    .sort();
}

async function ensureMigrationsTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name varchar(255) NOT NULL PRIMARY KEY,
      applied_at datetime NOT NULL DEFAULT current_timestamp()
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci`);
}

// Read-only: `--status` must be safe to run before anyone approves a migration.
async function pendingMigrations(conn) {
  const [[{ exists }]] = await conn.query(
    "SELECT COUNT(*) AS `exists` FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'schema_migrations'",
  );
  if (!exists) return migrationFiles();
  const [rows] = await conn.query('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((row) => row.name));
  return migrationFiles().filter((file) => !applied.has(file));
}

// MariaDB commits every ALTER/CREATE immediately, so a migration can't be rolled
// back. Each file is kept to statements that are atomic on their own (one ALTER
// per table, IF NOT EXISTS guards) and is only recorded after it succeeds.
// `conn` must be opened with multipleStatements: true.
async function runMigrations(conn, { log = console.log } = {}) {
  await ensureMigrationsTable(conn);
  const pending = await pendingMigrations(conn);
  for (const file of pending) {
    await conn.query(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
    await conn.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
    log(`  applied ${file}`);
  }
  return pending;
}

async function main() {
  const db = require('../config/db');
  const statusOnly = process.argv.includes('--status');
  const conn = await db.createConnection({ multipleStatements: true });
  try {
    const [[{ name }]] = await conn.query('SELECT DATABASE() AS name');
    const pending = await pendingMigrations(conn);
    console.log(`Database: ${name}`);
    if (!pending.length) {
      console.log('No pending migrations.');
      return;
    }
    if (statusOnly) {
      console.log(`Pending (${pending.length}):`);
      pending.forEach((file) => console.log(`  ${file}`));
      return;
    }
    console.log(`Applying ${pending.length} migration(s):`);
    await runMigrations(conn);
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`Migration failed: ${err.code || ''} ${err.message}`);
    process.exit(1);
  });
}

module.exports = { runMigrations, pendingMigrations, migrationFiles };
