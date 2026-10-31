const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const db = require('../config/db');
const { runMigrations } = require('./migrate');

const BASELINE = path.join(__dirname, '..', 'db', 'baseline.sql');
const FIXTURES = path.join(__dirname, '..', 'db', 'seeds', 'test-fixtures.sql');

// Rebuilds the test database from scratch: baseline schema (csi_db as imported),
// every migration, then the fixtures. Running the real migrations each time is
// what proves they still apply cleanly.

// MariaDB/InnoDB can keep a stale tablespace registration after a blocked drop,
// which makes CREATE TABLE fail with "Tablespace for table ... exists". The only
// way to clear it is to drop the whole database and recreate it. We do that once
// before loading the baseline; if the drop is refused and the schema is empty, we
// fall back to ensuring tables via `CREATE TABLE IF NOT EXISTS` so the baseline
// still runs without re-registering a live tablespace.
async function dropDatabase(name, conn, log) {
  try {
    await conn.query(`DROP DATABASE IF EXISTS \`${name}\``);
    log(`[test-db] ${name}: dropped`);
  } catch (err) {
    if (err.code !== 'ER_DB_DROP_RMDIR') throw err;
    log(`[test-db] ${name}: drop refused, leaving schema for in-place clear`);
  }
}

// Recreate the database if it is still registered with no visible tables. This is
// the only SQL-level operation that clears InnoDB's stale tablespace state.
async function recreateEmptyDatabase(name, conn, log) {
  const [tableRows] = await conn.query(`SHOW TABLES FROM \`${name}\``);
  if (tableRows.length) return false;
  try {
    await conn.query(`DROP DATABASE \`${name}\``);
    await conn.query(
      `CREATE DATABASE \`${name}\` CHARACTER SET utf8 COLLATE utf8_unicode_ci`,
    );
    log(`[test-db] ${name}: recreated empty schema`);
    return true;
  } catch (err) {
    if (err.code !== 'ER_DB_DROP_RMDIR') throw err;
    log(`[test-db] ${name}: cannot recreate; leaving schema as-is`);
    return false;
  }
}

async function resetTestDb({ log = console.log } = {}) {
  const name = process.env.DB_NAME;
  // This drops a database, so only ever touch one whose name says it's for tests.
  if (!/^[A-Za-z0-9_]+_test$/.test(name || '')) {
    throw new Error(`Refusing to reset "${name}": DB_NAME must end with _test (check .env.test)`);
  }

  const conn = await db.createConnection({ database: undefined, multipleStatements: true });
  try {
    await dropDatabase(name, conn, log);
    // The drop can leave the schema behind, so make sure it exists (or comes back).
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8 COLLATE utf8_unicode_ci`);
    await conn.query(`USE \`${name}\``);

    // Load the baseline; if InnoDB still holds a stale tablespace, recreate the
    // schema and retry.
    const baselineSql = fs.readFileSync(BASELINE, 'utf8');
    try {
      await conn.query(baselineSql);
    } catch (err) {
      if (err.code !== 'ER_TABLESPACE_EXISTS') throw err;
      log(`[test-db] ${name}: tablespace conflict, recreating schema and retrying`);
      await recreateEmptyDatabase(name, conn, log);
      await conn.query(`USE \`${name}\``);
      await conn.query(baselineSql);
    }
    log(`[test-db] ${name}: baseline loaded`);

    // Migrations and fixtures can hit the same conflict.
    try {
      await runMigrations(conn, { log });
      await conn.query(fs.readFileSync(FIXTURES, 'utf8'));
    } catch (err) {
      if (err.code !== 'ER_TABLESPACE_EXISTS') throw err;
      log(`[test-db] ${name}: tablespace conflict during migrations, recreating schema`);
      await recreateEmptyDatabase(name, conn, log);
      await conn.query(`USE \`${name}\``);
      await conn.query(baselineSql);
      await runMigrations(conn, { log });
      await conn.query(fs.readFileSync(FIXTURES, 'utf8'));
    }
    log(`[test-db] ${name}: fixtures loaded`);
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  resetTestDb().catch((err) => {
    console.error(`Test database reset failed: ${err.code || ''} ${err.message}`);
    process.exit(1);
  });
}

module.exports = { resetTestDb };
