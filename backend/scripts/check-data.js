// Read-only data-quality report for csi_db. Nothing is fixed here: findings are
// reviewed with QC first (PLAN.md §3).
const { INSPECT_TYPE, INSPECT_STATUS, normalizeInspectType } = require('../constants/inspection');

const EXAMPLES = 5;
const EPSILON = 0.005;

// '±0.4' -> {plus 0.4, minus 0.4}; '+0.3/-0' -> {plus 0.3, minus 0}; else null.
function parseTolerance(text) {
  const t = (text || '').trim();
  let m = t.match(/^±\s*(\d+(?:\.\d+)?)$/);
  if (m) return { plus: Number(m[1]), minus: Number(m[1]) };
  m = t.match(/^\+\s*(\d+(?:\.\d+)?)\s*\/\s*-\s*(\d+(?:\.\d+)?)$/);
  if (m) return { plus: Number(m[1]), minus: Number(m[2]) };
  return null;
}

// Only standard_txt that is a single number (optionally Ø, a unit or %) is
// compared; descriptive texts like 'SUS 201 and SUS 304' are skipped.
function singleNumber(text) {
  const m = (text || '')
    .trim()
    .replace(',', '.')
    .match(/^[Ø⌀]?\s*(\d+(?:\.\d+)?)\s*(?:[a-zA-Z]{1,4}(?:\/[a-zA-Z]{1,4}²?)?|%)?$/);
  return m ? Number(m[1]) : null;
}

const isOneSided = (text) => ['MIN', 'MAX'].includes((text || '').trim().toUpperCase());
const isZeroText = (text) => /^0(\.0+)?$/.test((text || '').trim());
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

    const std = standards.filter((r) => normalizeInspectType(r.inspecttype) === INSPECT_TYPE.STD);

    add(
      'STD with a negative tolerance_plus or tolerance_minus',
      std.filter((r) => r.tolerance_plus < 0 || r.tolerance_minus < 0),
      label,
    );

    add(
      'STD whose tolerance text disagrees with tolerance_plus / tolerance_minus',
      std.filter((r) => {
        const parsed = parseTolerance(r.tolerance);
        return (
          parsed &&
          (Math.abs(parsed.plus - r.tolerance_plus) > EPSILON ||
            Math.abs(parsed.minus - Math.abs(r.tolerance_minus)) > EPSILON ||
            r.tolerance_minus < 0)
        );
      }),
      label,
    );

    const zero = std.filter(
      (r) => !isOneSided(r.tolerance) && r.tolerance_plus === 0 && r.tolerance_minus === 0,
    );
    add(
      'STD with no tolerance at all (judging rule unclear, PLAN.md Q3)',
      zero.filter((r) => isZeroText(r.tolerance)),
      label,
    );
    add(
      'STD whose tolerance is qualitative text (e.g. "Tidak Terangkat")',
      zero.filter((r) => !isZeroText(r.tolerance) && !parseTolerance(r.tolerance)),
      label,
    );

    add(
      'STD where the printed standard_txt number differs from standard',
      std.filter((r) => {
        const n = singleNumber(r.standard_txt);
        return n !== null && r.standard !== null && Math.abs(n - r.standard) > EPSILON;
      }),
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
