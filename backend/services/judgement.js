// OK/NG and judgment rules (PLAN.md §2.1, §2.4). Pure functions: no database, no
// request objects, so the server and (mirrored) the frontend apply the same rules.
//
// All comparisons use integer hundredths: values are decimal(18,2) and floating-point
// arithmetic would misjudge values that sit exactly on a limit.

const { LINE_STATUS, JUDGMENT } = require('../constants/inspection');

// How a STD rule is judged.
const RULE_MODE = Object.freeze({
  RANGE: 'RANGE', // standard − minus ≤ actual ≤ standard + plus
  MIN: 'MIN', // actual ≥ standard
  MAX: 'MAX', // actual ≤ standard
  // No usable limits (both tolerances 0, or a text like "Tidak Terangkat"):
  // the inspector sets OK/NG by hand, like a visual check (decided 2026-10-01).
  MANUAL: 'MANUAL',
});

const DECIMAL_PATTERN = /^-?\d+(?:\.\d{1,2})?$/;

// 12.62, '12.62' or '12,62' → 1262. Empty → null. Anything else (text, three
// decimals, NaN) → undefined, so callers can tell "not measured" from "invalid".
function toHundredths(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return undefined;
    const scaled = value * 100;
    const rounded = Math.round(scaled);
    return Math.abs(scaled - rounded) < 1e-6 ? rounded : undefined;
  }
  const text = String(value).trim().replace(',', '.');
  if (text === '') return null;
  if (!DECIMAL_PATTERN.test(text)) return undefined;
  const negative = text.startsWith('-');
  const [whole, frac = ''] = text.replace('-', '').split('.');
  const hundredths = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  return negative ? -hundredths : hundredths;
}

// A rule from an inventinspectitem row (tolerance = display text).
function ruleFromStandard(row) {
  return {
    standard: row.standard,
    text: row.tolerance,
    plus: row.tolerance_plus,
    minus: row.tolerance_minus,
  };
}

// A rule from an inspectline snapshot (tolerance_txt = display text).
function ruleFromLine(row) {
  return {
    standard: row.standard,
    text: row.tolerance_txt,
    plus: row.tolerance_plus,
    minus: row.tolerance_minus,
  };
}

function ruleMode(rule) {
  const text = String(rule.text ?? '')
    .trim()
    .toUpperCase();
  if (text === 'MIN') return RULE_MODE.MIN;
  if (text === 'MAX') return RULE_MODE.MAX;
  // A missing or unreadable standard can't be compared against.
  const standard = toHundredths(rule.standard);
  if (standard === null || standard === undefined) return RULE_MODE.MANUAL;
  const plus = Math.abs(toHundredths(rule.plus) || 0);
  const minus = Math.abs(toHundredths(rule.minus) || 0);
  return plus === 0 && minus === 0 ? RULE_MODE.MANUAL : RULE_MODE.RANGE;
}

// Limits in hundredths; null where a side is open. A negative tolerance_minus is a
// data-entry slip ('-0.5/-0' stored as -5.00), so its size is used.
function limits(rule) {
  const mode = ruleMode(rule);
  const s = toHundredths(rule.standard);
  switch (mode) {
    case RULE_MODE.RANGE:
      return {
        mode,
        lower: s - Math.abs(toHundredths(rule.minus) || 0),
        upper: s + Math.abs(toHundredths(rule.plus) || 0),
      };
    case RULE_MODE.MIN:
      return { mode, lower: s, upper: null };
    case RULE_MODE.MAX:
      return { mode, lower: null, upper: s };
    default:
      return { mode, lower: null, upper: null };
  }
}

// One measured value → LINE_STATUS.OK, LINE_STATUS.NG or null.
// null means "not measured", or a MANUAL rule whose status the inspector sets.
function judgeValue(rule, actual) {
  const value = toHundredths(actual);
  if (value === undefined)
    throw new TypeError(`Not a valid measurement: ${JSON.stringify(actual)}`);
  if (value === null) return null;
  const { mode, lower, upper } = limits(rule);
  if (mode === RULE_MODE.MANUAL) return null;
  const ok = (lower === null || value >= lower) && (upper === null || value <= upper);
  return ok ? LINE_STATUS.OK : LINE_STATUS.NG;
}

// Statuses for one STD line across the delivery columns. For MANUAL rules the
// inspector's own OK/NG (manual[i]) is kept; for the others it's computed and any
// client-sent status is ignored.
function judgeLine(rule, actuals, manual = []) {
  const manualRule = ruleMode(rule) === RULE_MODE.MANUAL;
  return actuals.map((actual, i) => {
    if (!manualRule) return judgeValue(rule, actual);
    const status = manual[i];
    return status === LINE_STATUS.OK || status === LINE_STATUS.NG ? status : null;
  });
}

// NG cells per delivery column, over every line (STD and visual/fitting/COA).
// Each item of `statusRows` is an array of statuses indexed by column.
function countNgCells(statusRows, columns) {
  const counts = Array(columns).fill(0);
  for (const row of statusRows) {
    for (let c = 0; c < columns; c++) if (row[c] === LINE_STATUS.NG) counts[c] += 1;
  }
  return counts;
}

// AQL counts defective pieces, not NG cells: one piece with two NG dimensions is 1.
// So the inspector enters the pieces, but it can't be 0 while a cell is NG.
const minimumDefects = (ngCells) => (ngCells > 0 ? 1 : 0);

// The system's suggestion for one delivery, from its defective pieces and AQL row.
function suggestJudgment(defects, plan) {
  return defects <= plan.acceptnum ? JUDGMENT.ACCEPTED : JUDGMENT.REJECTED;
}

// Business-rule problems with a delivery's judgment, as error details
// ([] when it is fine). The judgment itself stays a human decision.
function judgmentProblems({ judgment, defects, ngCells, plan, note }) {
  const problems = [];
  if (defects < minimumDefects(ngCells)) {
    problems.push({
      field: 'notgood',
      message: `is ${defects}, but ${ngCells} value(s) are NG: at least 1 piece is defective`,
    });
  }
  if (judgment === JUDGMENT.ACCEPTED && defects > plan.acceptnum) {
    problems.push({
      field: 'judgment',
      message: `can't be Accepted: ${defects} defective > Ac ${plan.acceptnum}`,
    });
  }
  if (judgment === JUDGMENT.CONCESSION) {
    if (defects < plan.rejectnum) {
      problems.push({
        field: 'judgment',
        message: `Concession is only for a rejected delivery (defective ≥ Re ${plan.rejectnum})`,
      });
    }
    if (!String(note ?? '').trim())
      problems.push({ field: 'concessionnote', message: 'is required for a Concession' });
  }
  return problems;
}

module.exports = {
  RULE_MODE,
  toHundredths,
  ruleFromStandard,
  ruleFromLine,
  ruleMode,
  limits,
  judgeValue,
  judgeLine,
  countNgCells,
  minimumDefects,
  suggestJudgment,
  judgmentProblems,
};
