// Read-only data-quality report for csi_db. Nothing is fixed here: findings are
// reviewed with QC first (PLAN.md §3).
const { INSPECT_STATUS, normalizeInspectType } = require('../constants/inspection');

const { WARNING, standardWarnings } = require('../services/standard-check');

const EXAMPLES = 5;
const label = (r) =>
  `${r.itemid} / ${r.inspecttype.trim()} / ${r.inspectitem.trim()}: standard_txt=${JSON.stringify(r.standard_txt)} standard=${r.standard} tolerance=${JSON.stringify(r.tolerance)} +${r.tolerance_plus}/-${r.tolerance_minus}`;

async function main() {
  const db = require('../config/db');
  const conn = await db.createConnection();
  const findings = [];
  const add = (title, rows, format = (r) => JSON.stringify(r)) =>
    findings.push({ title, count: rows.length, examples: rows.slice(0, EXAMPLES).map(format) });

  try {
    const [[{ name }]] = await conn.query('SELECT DATABASE() AS name');

    const [dupItems] = await conn.query(
      'SELECT itemid, COUNT(*) AS n FROM inventtable GROUP BY itemid HAVING n > 1',
    );
    add('Duplicate inventtable.itemid (blocks migration 001)', dupItems);

    const [dupVendors] = await conn.query(
      'SELECT vendaccount, COUNT(*) AS n FROM vendtable GROUP BY vendaccount HAVING n > 1',
    );
    add('Duplicate vendtable.vendaccount (blocks migration 002)', dupVendors);

    const [orphans] = await conn.query(
      'SELECT DISTINCT i.itemid FROM inventinspectitem i LEFT JOIN inventtable t ON t.itemid = i.itemid WHERE t.itemid IS NULL',
    );
    add('Standards whose itemid is missing from inventtable', orphans);

    const [standards] = await conn.query('SELECT * FROM inventinspectitem');

    const types = new Map();
    for (const r of standards) types.set(r.inspecttype, (types.get(r.inspecttype) || 0) + 1);
    add(
      'inspecttype values with surrounding spaces (normalized when read)',
      [...types].filter(([t]) => t !== t.trim()),
      ([t, n]) => `${JSON.stringify(t)}: ${n} rows`,
    );
    add(
      'inspecttype values that are not a known type',
      [...types].filter(([t]) => !normalizeInspectType(t)),
      ([t, n]) => `${JSON.stringify(t)}: ${n} rows`,
    );

    // Same rules the app uses to flag standards (services/standard-check.js).
    const flagged = standards.map((r) => ({ r, w: standardWarnings(r) }));
    const withWarning = (code) => flagged.filter((f) => f.w.includes(code)).map((f) => f.r);
    add(
      'STD with a negative tolerance_plus or tolerance_minus',
      withWarning(WARNING.NEGATIVE_TOLERANCE),
      label,
    );
    add(
      'STD whose tolerance text disagrees with tolerance_plus / tolerance_minus',
      withWarning(WARNING.TOLERANCE_TEXT_MISMATCH),
      label,
    );
    add('STD with no tolerance at all (judged by hand)', withWarning(WARNING.NO_LIMITS), label);
    add(
      'STD whose tolerance is qualitative text (judged by hand)',
      withWarning(WARNING.QUALITATIVE_TOLERANCE),
      label,
    );
    add(
      'STD where the printed standard_txt number differs from standard',
      withWarning(WARNING.STANDARD_TEXT_MISMATCH),
      label,
    );

    const [legacy] = await conn.query(
      'SELECT inspectnum, inspectstatus FROM inspecttable WHERE inspectstatus IS NULL OR inspectstatus NOT IN (?)',
      [Object.values(INSPECT_STATUS)],
    );
    add('Inspections with a legacy inspectstatus (shown read-only)', legacy);

    console.log(`Data check for ${name}\n`);
    for (const f of findings) {
      console.log(`${f.count ? '!' : '✓'} ${f.title}: ${f.count}`);
      f.examples.forEach((e) => console.log(`    ${e}`));
      if (f.count > f.examples.length) console.log(`    … ${f.count - f.examples.length} more`);
    }
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(`Data check failed: ${err.code || ''} ${err.message}`);
  process.exit(1);
});
