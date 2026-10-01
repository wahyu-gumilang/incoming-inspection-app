// Flags doubtful QC standards (inventinspectitem rows) so the UI can warn about
// them and QC can fix them (PLAN.md §3, decided 2026-10-01). Nothing is changed:
// judging always uses the stored numbers.

const { RULE_MODE, ruleFromStandard, ruleMode } = require('./judgement');
const { INSPECT_TYPE, normalizeInspectType } = require('../constants/inspection');

const WARNING = Object.freeze({
  // No usable limits: the inspector judges it by hand.
  NO_LIMITS: 'NO_LIMITS',
  // Text like "Tidak Terangkat" where a number was expected.
  QUALITATIVE_TOLERANCE: 'QUALITATIVE_TOLERANCE',
  // A tolerance stored as a negative number ('-0.5/-0' stored as -5.00).
  NEGATIVE_TOLERANCE: 'NEGATIVE_TOLERANCE',
  // The printed tolerance disagrees with tolerance_plus / tolerance_minus.
  TOLERANCE_TEXT_MISMATCH: 'TOLERANCE_TEXT_MISMATCH',
  // The printed standard disagrees with the stored one (often ×100).
  STANDARD_TEXT_MISMATCH: 'STANDARD_TEXT_MISMATCH',
});

const EPSILON = 0.005;

// '±0.4' → {plus 0.4, minus 0.4}; '+0.3/-0' → {plus 0.3, minus 0}; anything else → null.
function parseToleranceText(text) {
  const t = String(text ?? '').trim();
  let m = t.match(/^±\s*(\d+(?:\.\d+)?)$/);
  if (m) return { plus: Number(m[1]), minus: Number(m[1]) };
  m = t.match(/^\+\s*(\d+(?:\.\d+)?)\s*\/\s*-\s*(\d+(?:\.\d+)?)$/);
  if (m) return { plus: Number(m[1]), minus: Number(m[2]) };
  return null;
}

// A standard_txt that is a single number (optionally Ø, a unit or %); descriptive
// texts like 'SUS 201 and SUS 304' give null and are not compared.
function singleNumber(text) {
  const m = String(text ?? '')
    .trim()
    .replace(',', '.')
    .match(/^[Ø⌀]?\s*(\d+(?:\.\d+)?)\s*(?:[a-zA-Z]{1,4}(?:\/[a-zA-Z]{1,4}²?)?|%)?$/);
  return m ? Number(m[1]) : null;
}

const isZeroText = (text) => /^0(\.0+)?$/.test(String(text ?? '').trim());

// Warning codes for one standard; only dimension (STD) rows are checked.
function standardWarnings(row) {
  if (normalizeInspectType(row.inspecttype) !== INSPECT_TYPE.STD) return [];
  const warnings = [];
  const mode = ruleMode(ruleFromStandard(row));

  if (mode === RULE_MODE.MANUAL) {
    const text = String(row.tolerance ?? '').trim();
    warnings.push(
      text === '' || isZeroText(text) || parseToleranceText(text)
        ? WARNING.NO_LIMITS
        : WARNING.QUALITATIVE_TOLERANCE,
    );
  }
  if (Number(row.tolerance_plus) < 0 || Number(row.tolerance_minus) < 0)
    warnings.push(WARNING.NEGATIVE_TOLERANCE);

  const parsed = parseToleranceText(row.tolerance);
  if (
    parsed &&
    (Math.abs(parsed.plus - Number(row.tolerance_plus)) > EPSILON ||
      Math.abs(parsed.minus - Math.abs(Number(row.tolerance_minus))) > EPSILON ||
      Number(row.tolerance_minus) < 0)
  ) {
    warnings.push(WARNING.TOLERANCE_TEXT_MISMATCH);
  }

  const printed = singleNumber(row.standard_txt);
  if (
    printed !== null &&
    row.standard !== null &&
    Math.abs(printed - Number(row.standard)) > EPSILON
  ) {
    warnings.push(WARNING.STANDARD_TEXT_MISMATCH);
  }
  return warnings;
}

module.exports = { WARNING, standardWarnings, parseToleranceText, singleNumber };
