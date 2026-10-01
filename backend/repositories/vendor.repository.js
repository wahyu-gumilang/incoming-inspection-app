const db = require('../config/db');

// inspectionCount: how many inspections use the vendor (inspecttable.accountnum).
const SELECT = `
  SELECT v.vendaccount, v.name, COALESCE(u.n, 0) AS inspectionCount
    FROM vendtable v
    LEFT JOIN (SELECT accountnum, COUNT(*) AS n FROM inspecttable GROUP BY accountnum) u ON u.accountnum = v.vendaccount`;

function filters({ q }) {
  if (!q) return { sql: '', params: [] };
  return { sql: 'WHERE v.vendaccount LIKE ? OR v.name LIKE ?', params: [`%${q}%`, `%${q}%`] };
}

async function list({ q, orderBy, limit, offset }, conn = db) {
  const { sql, params } = filters({ q });
  // orderBy comes from resolveSort() and its whitelist; limit/offset are validated integers.
  const [rows] = await conn.query(`${SELECT} ${sql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`, [
    ...params,
    limit,
    offset,
  ]);
  return rows;
}

async function count({ q }, conn = db) {
  const { sql, params } = filters({ q });
  const [rows] = await conn.query(`SELECT COUNT(*) AS total FROM vendtable v ${sql}`, params);
  return rows[0].total;
}

async function lookup(q, limit, conn = db) {
  const [rows] = await conn.query(
    'SELECT vendaccount, name FROM vendtable WHERE vendaccount LIKE ? OR name LIKE ? ORDER BY name LIMIT ?',
    [`${q}%`, `%${q}%`, limit],
  );
  return rows;
}

async function findById(vendaccount, conn = db) {
  const [rows] = await conn.query(`${SELECT} WHERE v.vendaccount = ?`, [vendaccount]);
  return rows[0] || null;
}

async function existing(vendaccounts, conn = db) {
  if (!vendaccounts.length) return [];
  const [rows] = await conn.query('SELECT vendaccount FROM vendtable WHERE vendaccount IN (?)', [
    vendaccounts,
  ]);
  return rows.map((r) => r.vendaccount);
}

async function insert({ vendaccount, name }, conn = db) {
  await conn.execute('INSERT INTO vendtable (vendaccount, name) VALUES (?, ?)', [
    vendaccount,
    name,
  ]);
}

async function rename(vendaccount, name, conn = db) {
  const [result] = await conn.execute('UPDATE vendtable SET name = ? WHERE vendaccount = ?', [
    name,
    vendaccount,
  ]);
  return result.affectedRows;
}

async function remove(vendaccount, conn = db) {
  const [result] = await conn.execute('DELETE FROM vendtable WHERE vendaccount = ?', [vendaccount]);
  return result.affectedRows;
}

module.exports = { list, count, lookup, findById, existing, insert, rename, remove };
