const db = require('../config/db');
const { COLUMN_NUMBERS } = require('../constants/inspection');

// SQL fragments for the 7 delivery columns, built once from the constant list.
const JUDGMENT_SUM = COLUMN_NUMBERS.map((n) => `IFNULL(judgment${n}, 0)`).join(' + ');
const NOTGOOD_SUM = COLUMN_NUMBERS.map((n) => `IFNULL(notgood${n}, 0)`).join(' + ');
const QTY_SUM = COLUMN_NUMBERS.map((n) => `IFNULL(qty_received${n}, 0)`).join(' + ');
const JUDGED_FILTER = COLUMN_NUMBERS.map((n) => `judgment${n} IN (1, 3)`).join(' OR ');
const ACCEPTED_QTY = COLUMN_NUMBERS.map((n) => `IF(judgment${n} IN (1,3), IFNULL(qty_received${n},0), 0)`).join(' + ');

function monthStart(period) {
  switch (period) {
    case '90d':
      return `DATE_SUB(CURDATE(), INTERVAL 90 DAY)`;
    case 'quarter':
      return `DATE_FORMAT(CURDATE(), '%Y-01-01')`;
    case 'year':
      return `DATE_FORMAT(CURDATE(), '%Y-01-01')`;
    case 'month':
    default:
      return `DATE_FORMAT(CURDATE(), '%Y-%m-01')`;
  }
}

function monthEnd(period) {
  switch (period) {
    case '90d':
      return `DATE_ADD(CURDATE(), INTERVAL 1 DAY)`;
    case 'quarter':
      return `DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-01-01'), INTERVAL 1 YEAR)`;
    case 'year':
      return `DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-01-01'), INTERVAL 1 YEAR)`;
    case 'month':
    default:
      return `DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)`;
  }
}

async function kpis(period = 'month') {
  const [rows] = await db.query(
    `SELECT
       COUNT(*)                                          AS inspections,
       SUM(${JUDGMENT_SUM})                              AS judged,
       SUM(${NOTGOOD_SUM})                               AS ng,
       SUM(${QTY_SUM})                                   AS qty,
       SUM(${ACCEPTED_QTY})                              AS acceptedQty,
       SUM(CASE WHEN inspectstatus = 'SUBMITTED' THEN 1 ELSE 0 END)              AS waiting,
       SUM(CASE WHEN inspectstatus = 'SUBMITTED'
                 AND created_at < NOW() - INTERVAL 1 DAY THEN 1 ELSE 0 END)     AS waitingOld
     FROM inspecttable
     WHERE inspectdate >= ${monthStart(period)}
       AND inspectdate < ${monthEnd(period)}`,
  );
  const r = rows[0];
  const judged = Number(r.judged) || 0;
  const qty = Number(r.qty) || 0;
  const acceptedQty = Number(r.acceptedQty) || 0;
  return {
    inspections: Number(r.inspections) || 0,
    ngRate: judged ? +(Number(r.ng) / judged).toFixed(4) : 0,
    waiting: Number(r.waiting) || 0,
    waitingOld: Number(r.waitingOld) || 0,
    acceptedRate: qty ? +(acceptedQty / qty).toFixed(4) : 0,
  };
}

// One point per calendar month over the last N months.
async function monthly(months = 6) {
  const [rows] = await db.query(
    `SELECT
       DATE_FORMAT(inspectdate, '%Y-%m') AS m,
       COUNT(*)                           AS n,
       SUM(${NOTGOOD_SUM})                AS ng
     FROM inspecttable
     WHERE inspectdate IS NOT NULL
       AND inspectdate >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL ? MONTH)
     GROUP BY m`,
    [months - 1],
  );
  const byMonth = new Map(rows.map((r) => [String(r.m), r]));
  const out = [];
  const base = new Date();
  base.setDate(1);
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const r = byMonth.get(key);
    out.push({
      month: key,
      inspections: r ? Number(r.n) : 0,
      ng: r ? Number(r.ng) : 0,
    });
  }
  return out;
}

// Top 5 suppliers by NG pieces within the period; deliveries without a final
// judgment are excluded (their notgood is not settled yet).
async function ngBySupplier(period = 'month') {
  const [rows] = await db.query(
    `SELECT
       name AS supplier,
       COUNT(*) AS deliveries,
       SUM(${NOTGOOD_SUM}) AS ng
     FROM inspecttable
     WHERE name IS NOT NULL
       AND (${JUDGED_FILTER})
       AND inspectdate >= ${monthStart(period)}
       AND inspectdate < ${monthEnd(period)}
     GROUP BY name
     ORDER BY ng DESC
     LIMIT 5`,
  );
  return rows.map((r) => ({
    supplier: r.supplier,
    deliveries: Number(r.deliveries),
    ng: Number(r.ng),
  }));
}

// The 5 newest inspections regardless of status.
async function recent(limit = 5) {
  const [rows] = await db.query(
    `SELECT inspectnum, inspectdate, itemname, name, inspectstatus,
            SUM(${NOTGOOD_SUM}) AS ng,
            ${JUDGMENT_SUM}     AS judged
     FROM inspecttable
     GROUP BY inspectnum
     ORDER BY inspectnum DESC
     LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({
    inspectnum: r.inspectnum,
    inspectdate: r.inspectdate ? String(r.inspectdate).slice(0, 10) : null,
    itemname: r.itemname,
    supplier: r.name,
    status: r.inspectstatus,
    ng: Number(r.ng),
    judged: Number(r.judged),
  }));
}

// SUBMITTED inspections for the "Waiting for your check" card.
async function waiting(limit = 5) {
  const [rows] = await db.query(
    `SELECT inspectnum, itemname, name, inspectby, created_at,
            SUM(${NOTGOOD_SUM}) AS ng
     FROM inspecttable
     WHERE inspectstatus = 'SUBMITTED'
     GROUP BY inspectnum
     ORDER BY inspectnum DESC
     LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({
    inspectnum: r.inspectnum,
    itemname: r.itemname,
    supplier: r.name,
    ng: Number(r.ng),
    inspectby: r.inspectby,
    created_at: r.created_at ? String(r.created_at).replace(' ', 'T') : null,
  }));
}

// The drafts this user owns, for the "Your drafts" card.
async function drafts(userid, limit = 5) {
  const [rows] = await db.query(
    `SELECT inspectnum, itemname,
            SUM(${NOTGOOD_SUM}) AS ng
     FROM inspecttable
     WHERE inspectstatus = 'DRAFT' AND inspectbyid = ?
     GROUP BY inspectnum
     ORDER BY inspectnum DESC
     LIMIT ?`,
    [userid, limit],
  );
  return rows.map((r) => ({
    inspectnum: r.inspectnum,
    itemname: r.itemname,
    ng: Number(r.ng),
  }));
}

module.exports = { kpis, monthly, ngBySupplier, recent, waiting, drafts };
