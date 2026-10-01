const db = require('../config/db');

// inventinspectitem keys may carry trailing spaces ('FITTING ', 'Black '). The
// utf8_unicode_ci collation ignores trailing spaces when comparing, so a trimmed
// value finds the stored row and duplicates are refused by the primary key.

const STANDARD_COLUMNS =
  'itemid, inspecttype, inspectitem, standard_txt, standard, tolerance, tolerance_plus, tolerance_minus';

function itemFilters({ q, hasStandards }) {
  const where = [];
  const params = [];
  if (q) {
    where.push('(t.itemid LIKE ? OR t.name LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (hasStandards !== undefined) {
    where.push(
      `${hasStandards ? '' : 'NOT '}EXISTS (SELECT 1 FROM inventinspectitem i WHERE i.itemid = t.itemid)`,
    );
  }
  return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

async function list({ q, hasStandards, orderBy, limit, offset }, conn = db) {
  const { sql, params } = itemFilters({ q, hasStandards });
  // orderBy comes from resolveSort() and its whitelist; limit/offset are validated integers.
  const [rows] = await conn.query(
    `SELECT t.itemid, t.name FROM inventtable t ${sql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  return rows;
}

async function count({ q, hasStandards }, conn = db) {
  const { sql, params } = itemFilters({ q, hasStandards });
  const [rows] = await conn.query(`SELECT COUNT(*) AS total FROM inventtable t ${sql}`, params);
  return rows[0].total;
}

async function lookup(q, limit, conn = db) {
  const [rows] = await conn.query(
    'SELECT itemid, name FROM inventtable WHERE itemid LIKE ? OR name LIKE ? ORDER BY itemid LIMIT ?',
    [`${q}%`, `%${q}%`, limit],
  );
  return rows;
}

async function findById(itemid, conn = db) {
  const [rows] = await conn.execute('SELECT itemid, name FROM inventtable WHERE itemid = ?', [
    itemid,
  ]);
  return rows[0] || null;
}

async function standardsFor(itemids, conn = db) {
  if (!itemids.length) return [];
  const [rows] = await conn.query(
    `SELECT ${STANDARD_COLUMNS} FROM inventinspectitem WHERE itemid IN (?)`,
    [itemids],
  );
  return rows;
}

async function insert({ itemid, name }, conn = db) {
  await conn.execute('INSERT INTO inventtable (itemid, name, inspectqty) VALUES (?, ?, 0)', [
    itemid,
    name,
  ]);
}

// itemname in inventinspectitem is a copy of the item name, kept in step here.
async function rename(itemid, name, conn = db) {
  await conn.execute('UPDATE inventtable SET name = ? WHERE itemid = ?', [name, itemid]);
  await conn.execute('UPDATE inventinspectitem SET itemname = ? WHERE itemid = ?', [name, itemid]);
}

async function findStandard(itemid, inspecttype, inspectitem, conn = db) {
  const [rows] = await conn.execute(
    `SELECT ${STANDARD_COLUMNS} FROM inventinspectitem WHERE itemid = ? AND inspecttype = ? AND inspectitem = ?`,
    [itemid, inspecttype, inspectitem],
  );
  return rows[0] || null;
}

async function insertStandard(itemname, s, conn = db) {
  await conn.execute(
    `INSERT INTO inventinspectitem
       (itemid, itemname, inspecttype, inspectitem, standard_txt, standard, tolerance, tolerance_plus, tolerance_minus)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      s.itemid,
      itemname,
      s.inspecttype,
      s.inspectitem,
      s.standard_txt,
      s.standard,
      s.tolerance,
      s.tolerance_plus,
      s.tolerance_minus,
    ],
  );
}

async function updateStandard(s, conn = db) {
  const [result] = await conn.execute(
    `UPDATE inventinspectitem
        SET standard_txt = ?, standard = ?, tolerance = ?, tolerance_plus = ?, tolerance_minus = ?
      WHERE itemid = ? AND inspecttype = ? AND inspectitem = ?`,
    [
      s.standard_txt,
      s.standard,
      s.tolerance,
      s.tolerance_plus,
      s.tolerance_minus,
      s.itemid,
      s.inspecttype,
      s.inspectitem,
    ],
  );
  return result.affectedRows;
}

async function deleteStandard(itemid, inspecttype, inspectitem, conn = db) {
  const [result] = await conn.execute(
    'DELETE FROM inventinspectitem WHERE itemid = ? AND inspecttype = ? AND inspectitem = ?',
    [itemid, inspecttype, inspectitem],
  );
  return result.affectedRows;
}

module.exports = {
  list,
  count,
  lookup,
  findById,
  standardsFor,
  insert,
  rename,
  findStandard,
  insertStandard,
  updateStandard,
  deleteStandard,
};
