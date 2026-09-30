const db = require('../config/db');

async function ping() {
  await db.query('SELECT 1');
}

module.exports = { ping };
