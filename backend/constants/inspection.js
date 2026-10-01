// Code maps for the int/varchar code columns in inspecttable and inspectline.
// The values are the proposal in PLAN.md §3 and still need QC confirmation
// (PLAN.md §6 Q1). Change them here only; nothing else may hard-code them.

// Form 7.4.3-F1 has 7 delivery columns; column N of the header matches
// actual_N / status_N of every line.
const COLUMN_COUNT = 7;
const COLUMN_NUMBERS = Object.freeze(Array.from({ length: COLUMN_COUNT }, (_, i) => i + 1));

function numbered(prefix) {
  return Object.freeze(COLUMN_NUMBERS.map((n) => `${prefix}${n}`));
}

// SQL for the numbered columns is built from these fixed lists, never from request input.
const HEADER_COLUMNS = Object.freeze({
  purchordernum: numbered('purchordernum'),
  deliverydate: numbered('deliverydate'),
  qty_received: numbered('qty_received'),
  inspectcategory: numbered('inspectcategory'),
  notgood: numbered('notgood'),
  judgment: numbered('judgment'),
});

const LINE_COLUMNS = Object.freeze({
  actual: numbered('actual_'),
  status: numbered('status_'),
});

// Stored values in inventinspectitem.inspecttype sometimes carry a trailing
// space ('FITTING ', 'VISUAL '). They are part of the PK, so they're
// normalized when read instead of being rewritten.
const INSPECT_TYPE = Object.freeze({
  STD: 'STD',
  CERTIFIKAT: 'CERTIFIKAT',
  VISUAL: 'VISUAL',
  FITTING: 'FITTING',
});

// Row order on the form: dimensions, then Certificate No, Visual, Fitting.
const INSPECT_TYPE_ORDER = Object.freeze([
  INSPECT_TYPE.STD,
  INSPECT_TYPE.CERTIFIKAT,
  INSPECT_TYPE.VISUAL,
  INSPECT_TYPE.FITTING,
]);

function normalizeInspectType(value) {
  if (typeof value !== 'string') return null;
  const type = value.trim().toUpperCase();
  return INSPECT_TYPE_ORDER.includes(type) ? type : null;
}

// inspectcategoryN. The form legend: T Tightening, N Normal, R Reduce, no mark = 100 %.
const INSPECT_CATEGORY = Object.freeze({
  FULL: 0,
  NORMAL: 1,
  REDUCE: 2,
  TIGHTENING: 3,
});

const INSPECT_CATEGORY_MARK = Object.freeze({
  [INSPECT_CATEGORY.FULL]: '',
  [INSPECT_CATEGORY.NORMAL]: 'N',
  [INSPECT_CATEGORY.REDUCE]: 'R',
  [INSPECT_CATEGORY.TIGHTENING]: 'T',
});

// judgmentN. The form legend: O Accepted, X Rejected, C Concession.
const JUDGMENT = Object.freeze({
  NONE: 0,
  ACCEPTED: 1,
  REJECTED: 2,
  CONCESSION: 3,
});

const JUDGMENT_MARK = Object.freeze({
  [JUDGMENT.NONE]: '',
  [JUDGMENT.ACCEPTED]: 'O',
  [JUDGMENT.REJECTED]: 'X',
  [JUDGMENT.CONCESSION]: 'C',
});

// status_N. A not-measured value is NULL, never NG.
const LINE_STATUS = Object.freeze({
  NG: 0,
  OK: 1,
});

// inspecttable.inspectstatus
const INSPECT_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  CHECKED: 'CHECKED',
});

module.exports = {
  COLUMN_COUNT,
  COLUMN_NUMBERS,
  HEADER_COLUMNS,
  LINE_COLUMNS,
  INSPECT_TYPE,
  INSPECT_TYPE_ORDER,
  normalizeInspectType,
  INSPECT_CATEGORY,
  INSPECT_CATEGORY_MARK,
  JUDGMENT,
  JUDGMENT_MARK,
  LINE_STATUS,
  INSPECT_STATUS,
};
