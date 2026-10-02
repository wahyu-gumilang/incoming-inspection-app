// AQL lookup and row checks (PLAN.md §2.3). Pure functions over plan rows as stored
// in aqlplanrow; the inspection service repeats the lookup on every save.

const { INSPECT_CATEGORY } = require('../constants/inspection');

const FULL_LETTER = '-';

// Every piece is inspected: the lot is the sample, and one defect rejects it.
const fullInspection = (lot) => ({
  codeletter: FULL_LETTER,
  samplesize: lot,
  acceptnum: 0,
  rejectnum: 1,
  fullInspection: true,
});

// lot + category → { codeletter, samplesize, acceptnum, rejectnum, fullInspection },
// or null when the plan has no rows for that category.
function findPlanRow(rows, lot, category) {
  if (!Number.isInteger(lot) || lot < 1)
    throw new RangeError(`Lot size must be a positive integer, got ${lot}`);
  if (category === INSPECT_CATEGORY.FULL) return fullInspection(lot);

  const own = rows
    .filter((r) => r.inspectcategory === category)
    .sort((a, b) => a.lotmin - b.lotmin);
  if (!own.length) return null;
  const row = own.find((r) => lot >= r.lotmin && (r.lotmax === null || lot <= r.lotmax));
  // Below the first range (e.g. a lot of 1): nothing to sample, inspect it all.
  if (!row) return fullInspection(lot);
  if (row.samplesize >= lot) return fullInspection(lot);
  return {
    codeletter: row.codeletter,
    samplesize: row.samplesize,
    acceptnum: row.acceptnum,
    rejectnum: row.rejectnum,
    fullInspection: false,
  };
}

// Problems with one category's rows before they replace the stored ones, as error
// details ([] when fine). Ranges must follow each other without gaps or overlaps,
// and only the last one may be open-ended.
function rowProblems(rows) {
  const problems = [];
  const sorted = [...rows].map((r, i) => ({ ...r, i })).sort((a, b) => a.lotmin - b.lotmin);
  sorted.forEach((r, k) => {
    const at = (field, message) => problems.push({ field: `rows.${r.i}.${field}`, message });
    if (r.lotmax !== null && r.lotmax < r.lotmin) at('lotmax', `must be ≥ lot from (${r.lotmin})`);
    if (r.rejectnum <= r.acceptnum) at('rejectnum', `must be greater than Ac (${r.acceptnum})`);
    if (r.acceptnum >= r.samplesize)
      at('acceptnum', `must be smaller than the sample size (${r.samplesize})`);
    const next = sorted[k + 1];
    if (!next) return;
    const atNext = (message) => problems.push({ field: `rows.${next.i}.lotmin`, message });
    if (r.lotmax === null) at('lotmax', 'only the last range may be open-ended');
    else if (next.lotmin <= r.lotmax) atNext(`overlaps the range ${r.lotmin}–${r.lotmax}`);
    else if (next.lotmin > r.lotmax + 1)
      atNext(`leaves lots ${r.lotmax + 1}–${next.lotmin - 1} without a row`);
  });
  return problems;
}

module.exports = { FULL_LETTER, findPlanRow, rowProblems };
