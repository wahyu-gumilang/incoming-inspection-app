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
async function resetTestDb({ log = console.log } = {}) {
  const name = process.env.DB_NAME;
  // This drops a database, so only ever touch one whose name says it's for tests.
  if (!/^[A-Za-z0-9_]+_test$/.test(name || '')) {
    throw new Error(`Refusing to reset "${name}": DB_NAME must end with _test (check .env.test)`);
  }

  const conn = await db.createConnection({ database: undefined, multipleStatements: true });
  try {
    await conn.query(`DROP DATABASE IF EXISTS \`${name}\``);
    await conn.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8 COLLATE utf8_unicode_ci`);
    await conn.query(`USE \`${name}\``);
    await conn.query(fs.readFileSync(BASELINE, 'utf8'));
    log(`[test-db] ${name}: baseline loaded`);
    await runMigrations(conn, { log });
    await conn.query(fs.readFileSync(FIXTURES, 'utf8'));
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
