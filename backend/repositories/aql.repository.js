const db = require('../config/db');

const ROW_COLUMNS = 'inspectcategory, lotmin, lotmax, codeletter, samplesize, acceptnum, rejectnum';
const isoDateTime = (v) => (v ? v.replace(' ', 'T') : null);
const toPlan = (row) =>
  row && { ...row, isdefault: Boolean(row.isdefault), updated_at: isoDateTime(row.updated_at) };

async function listPlans(conn = db) {
  const [rows] = await conn.query(
    'SELECT planid, name, inspectlevel, aql, isdefault, note, updated_at FROM aqlplan ORDER BY planid',
  );
  return rows.map(toPlan);
}

async function findPlan(planid, conn = db) {
  const [rows] = await conn.execute(
    'SELECT planid, name, inspectlevel, aql, isdefault, note, updated_at FROM aqlplan WHERE planid = ?',
    [planid],
  );
  return toPlan(rows[0]) || null;
}

async function findDefaultPlan(conn = db) {
  const [rows] = await conn.query(
    'SELECT planid, name, inspectlevel, aql, isdefault, note, updated_at FROM aqlplan WHERE isdefault = 1 LIMIT 1',
  );
  return toPlan(rows[0]) || null;
}

async function rows(planid, conn = db) {
  const [result] = await conn.execute(
    `SELECT ${ROW_COLUMNS} FROM aqlplanrow WHERE planid = ? ORDER BY inspectcategory, lotmin`,
    [planid],
  );
  return result;
}

// Replaces one category's rows; the caller runs it in a transaction.
async function replaceRows(planid, category, newRows, conn) {
  await conn.execute('DELETE FROM aqlplanrow WHERE planid = ? AND inspectcategory = ?', [
    planid,
    category,
  ]);
  for (const r of newRows) {
    await conn.execute(
      `INSERT INTO aqlplanrow (planid, ${ROW_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [planid, category, r.lotmin, r.lotmax, r.codeletter, r.samplesize, r.acceptnum, r.rejectnum],
    );
  }
  // Records when the plan last changed.
  await conn.execute('UPDATE aqlplan SET updated_at = current_timestamp() WHERE planid = ?', [
    planid,
  ]);
}

async function setDefault(planid, conn = db) {
  await conn.execute('UPDATE aqlplan SET isdefault = (planid = ?)', [planid]);
}

module.exports = { listPlans, findPlan, findDefaultPlan, rows, replaceRows, setDefault };
