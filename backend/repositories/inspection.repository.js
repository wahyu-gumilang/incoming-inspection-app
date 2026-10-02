const db = require('../config/db');
const {
  HEADER_COLUMNS,
  LINE_COLUMNS,
  COLUMN_NUMBERS,
  INSPECTION_PREFIX,
} = require('../constants/inspection');

// Column lists come from constants only, never from request input.
const DELIVERY_GROUPS = [
  'purchordernum',
  'deliverydate',
  'qty_received',
  'inspectcategory',
  'notgood',
  'judgment',
  'samplesize',
  'acceptnum',
  'rejectnum',
  'concessionnote',
];
const HEADER = [
  'inspectnum',
  'inspectdate',
  'itemid',
  'itemname',
  'accountnum',
  'name',
  'inspectstatus',
  'instrument',
  'aqlplanid',
  'qfnum',
  'inspectby',
  'inspectbyid',
  'checkedby',
  'created_at',
  'updated_at',
  ...DELIVERY_GROUPS.flatMap((g) => HEADER_COLUMNS[g]),
];
const LINE = [
  'inspectnum',
  'linenum',
  'inspecttype',
  'inspectitem',
  'standard_txt',
  'standard',
  'tolerance',
  'tolerance_txt',
  'tolerance_plus',
  'tolerance_minus',
  ...LINE_COLUMNS.actual,
  ...LINE_COLUMNS.status,
];
const OTHER_LINE = [
  'inspectnum',
  'linenum',
  'inspecttype',
  'inspectitem',
  'standard_txt',
  ...LINE_COLUMNS.actualText,
  ...LINE_COLUMNS.status,
];

// Table names can't be placeholders, so only these two are accepted.
const LINE_TABLES = new Set(['inspectline', 'inspectlineother']);

const LIST_COLUMNS = [
  'inspectnum',
  'inspectdate',
  'itemid',
  'itemname',
  'accountnum',
  'name',
  'inspectstatus',
  'inspectby',
  'inspectbyid',
  'created_at',
  ...HEADER_COLUMNS.purchordernum,
  ...HEADER_COLUMNS.qty_received,
  ...HEADER_COLUMNS.notgood,
  ...HEADER_COLUMNS.judgment,
];

function listFilters({ q, dateFrom, dateTo, item, vendor, status, judgment }) {
  const where = [];
  const params = [];
  if (q) {
    where.push(
      `(inspectnum LIKE ? OR ${HEADER_COLUMNS.purchordernum.map((c) => `${c} LIKE ?`).join(' OR ')})`,
    );
    params.push(`%${q}%`, ...HEADER_COLUMNS.purchordernum.map(() => `%${q}%`));
  }
  if (dateFrom) {
    where.push('inspectdate >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    where.push('inspectdate <= ?');
    params.push(dateTo);
  }
  if (item) {
    where.push('itemid = ?');
    params.push(item);
  }
  if (vendor) {
    where.push('accountnum = ?');
    params.push(vendor);
  }
  if (status) {
    where.push('inspectstatus = ?');
    params.push(status);
  }
  if (judgment !== undefined) {
    where.push(`? IN (${HEADER_COLUMNS.judgment.join(', ')})`);
    params.push(judgment);
  }
  return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

async function list(filter, { orderBy, limit, offset }, conn = db) {
  const { sql, params } = listFilters(filter);
  // orderBy comes from a whitelist; limit/offset are validated integers.
  const [rows] = await conn.query(
    `SELECT ${LIST_COLUMNS.join(', ')} FROM inspecttable ${sql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  return rows;
}

async function count(filter, conn = db) {
  const { sql, params } = listFilters(filter);
  const [rows] = await conn.query(`SELECT COUNT(*) AS total FROM inspecttable ${sql}`, params);
  return rows[0].total;
}

// forUpdate locks the header row for the rest of the caller's transaction.
async function findHeader(inspectnum, conn = db, { forUpdate = false } = {}) {
  const [rows] = await conn.query(
    `SELECT ${HEADER.join(', ')} FROM inspecttable WHERE inspectnum = ?${forUpdate ? ' FOR UPDATE' : ''}`,
    [inspectnum],
  );
  return rows[0] || null;
}

async function findLines(inspectnum, conn = db) {
  const [rows] = await conn.query(
    `SELECT ${LINE.join(', ')} FROM inspectline WHERE inspectnum = ? ORDER BY linenum`,
    [inspectnum],
  );
  return rows;
}

async function findOtherLines(inspectnum, conn = db) {
  const [rows] = await conn.query(
    `SELECT ${OTHER_LINE.join(', ')} FROM inspectlineother WHERE inspectnum = ? ORDER BY linenum`,
    [inspectnum],
  );
  return rows;
}

// Takes the next number under a row lock, so two saves at the same moment can't
// get the same one. Must run inside the caller's transaction.
async function takeNextNumber(conn) {
  const [[seq]] = await conn.query(
    'SELECT digits, nextnum FROM inspectnumseq WHERE prefix = ? FOR UPDATE',
    [INSPECTION_PREFIX],
  );
  if (!seq) throw new Error(`No ${INSPECTION_PREFIX} row in inspectnumseq`);
  let next = seq.nextnum;
  // Skip numbers already taken, e.g. by inspections made before the sequence existed.
  for (;;) {
    const candidate = `${INSPECTION_PREFIX}${String(next).padStart(seq.digits, '0')}`;
    const [[taken]] = await conn.query(
      'SELECT COUNT(*) AS n FROM inspecttable WHERE inspectnum = ?',
      [candidate],
    );
    next += 1;
    if (!taken.n) {
      await conn.execute('UPDATE inspectnumseq SET nextnum = ? WHERE prefix = ?', [
        next,
        INSPECTION_PREFIX,
      ]);
      return candidate;
    }
  }
}

async function insertHeader(header, conn) {
  const unused = Object.fromEntries([
    ...HEADER_COLUMNS.purchordernum.map((c) => [c, null]),
    // The column default is today, which would make an unused delivery look dated.
    ...HEADER_COLUMNS.deliverydate.map((c) => [c, null]),
  ]);
  const row = { ...unused, ...header };
  const cols = Object.keys(row);
  await conn.query(`INSERT INTO inspecttable (${cols.join(', ')}) VALUES (?)`, [
    cols.map((c) => row[c]),
  ]);
  // Timestamps from the database clock, like updated_at on every change.
  await conn.execute(
    'UPDATE inspecttable SET created_at = current_timestamp(), updated_at = current_timestamp() WHERE inspectnum = ?',
    [header.inspectnum],
  );
}

async function insertLines(table, rows, conn) {
  if (!LINE_TABLES.has(table)) throw new Error(`Not a line table: ${table}`);
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  await conn.query(`INSERT INTO ${table} (${cols.join(', ')}) VALUES ?`, [
    rows.map((r) => cols.map((c) => r[c])),
  ]);
}

// `fields` keys must be real column names chosen by the service, never request keys.
async function updateHeader(inspectnum, fields, conn = db) {
  const cols = Object.keys(fields);
  await conn.query(
    `UPDATE inspecttable SET ${cols.map((c) => `${c} = ?`).join(', ')}, updated_at = current_timestamp() WHERE inspectnum = ?`,
    [...cols.map((c) => fields[c]), inspectnum],
  );
}

async function updateLineColumn(table, inspectnum, linenum, fields, conn) {
  if (!LINE_TABLES.has(table)) throw new Error(`Not a line table: ${table}`);
  const cols = Object.keys(fields);
  await conn.query(
    `UPDATE ${table} SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE inspectnum = ? AND linenum = ?`,
    [...cols.map((c) => fields[c]), inspectnum, linenum],
  );
}

async function remove(inspectnum, conn) {
  await conn.execute('DELETE FROM inspectline WHERE inspectnum = ?', [inspectnum]);
  await conn.execute('DELETE FROM inspectlineother WHERE inspectnum = ?', [inspectnum]);
  await conn.execute('DELETE FROM inspecttable WHERE inspectnum = ?', [inspectnum]);
}

module.exports = {
  DELIVERY_GROUPS,
  COLUMN_NUMBERS,
  list,
  count,
  findHeader,
  findLines,
  findOtherLines,
  takeNextNumber,
  insertHeader,
  insertLines,
  updateHeader,
  updateLineColumn,
  remove,
};
