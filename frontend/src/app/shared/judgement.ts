// Mirror of backend/services/judgement.js for client-side OK/NG calculation.
// All comparisons use integer hundredths to avoid floating-point errors.

export const LINE_STATUS = {
  OK: 1,
  NG: 0,
} as const;

export const JUDGMENT = {
  NOT_JUDGED: 0,
  ACCEPTED: 1,
  REJECTED: 2,
  CONCESSION: 3,
} as const;

export const RULE_MODE = {
  RANGE: 'RANGE',
  MIN: 'MIN',
  MAX: 'MAX',
  MANUAL: 'MANUAL',
} as const;

type RuleMode = (typeof RULE_MODE)[keyof typeof RULE_MODE];

export interface Rule {
  standard: number | null;
  text: string | null;
  plus: number | null;
  minus: number | null;
}

interface Limits {
  mode: RuleMode;
  lower: number | null;
  upper: number | null;
}

const DECIMAL_PATTERN = /^-?\d+(?:\.\d{1,2})?$/;

function toHundredths(value: unknown): number | null | undefined {
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

export function ruleMode(rule: Rule): RuleMode {
  const text = String(rule.text ?? '').trim().toUpperCase();
  if (text === 'MIN') return RULE_MODE.MIN;
  if (text === 'MAX') return RULE_MODE.MAX;
  const standard = toHundredths(rule.standard);
  if (standard === null || standard === undefined) return RULE_MODE.MANUAL;
  const plus = Math.abs(toHundredths(rule.plus) || 0);
  const minus = Math.abs(toHundredths(rule.minus) || 0);
  return plus === 0 && minus === 0 ? RULE_MODE.MANUAL : RULE_MODE.RANGE;
}

export function limits(rule: Rule): Limits {
  const mode = ruleMode(rule);
  const s = toHundredths(rule.standard);
  switch (mode) {
    case RULE_MODE.RANGE:
      return {
        mode,
        lower: s! - Math.abs(toHundredths(rule.minus) || 0),
        upper: s! + Math.abs(toHundredths(rule.plus) || 0),
      };
    case RULE_MODE.MIN:
      return { mode, lower: s!, upper: null };
    case RULE_MODE.MAX:
      return { mode, lower: null, upper: s! };
    default:
      return { mode, lower: null, upper: null };
  }
}

export function judgeValue(rule: Rule, actual: unknown): number | null {
  const value = toHundredths(actual);
  if (value === undefined) throw new TypeError(`Not a valid measurement: ${JSON.stringify(actual)}`);
  if (value === null) return null;
  const { mode, lower, upper } = limits(rule);
  if (mode === RULE_MODE.MANUAL) return null;
  const ok = (lower === null || value >= lower) && (upper === null || value <= upper);
  return ok ? LINE_STATUS.OK : LINE_STATUS.NG;
}

export function judgeLine(
  rule: Rule,
  actuals: unknown[],
  manual: (number | null)[] = [],
): (number | null)[] {
  const manualRule = ruleMode(rule) === RULE_MODE.MANUAL;
  return actuals.map((actual, i) => {
    if (!manualRule) return judgeValue(rule, actual);
    const status = manual[i];
    return status === LINE_STATUS.OK || status === LINE_STATUS.NG ? status : null;
  });
}

export function countNgCells(statusRows: (number | null)[][], columns: number): number[] {
  const counts = Array(columns).fill(0);
  for (const row of statusRows) {
    for (let c = 0; c < columns; c++) {
      if (row[c] === LINE_STATUS.NG) counts[c] += 1;
    }
  }
  return counts;
}

export function minimumDefects(ngCells: number): number {
  return ngCells > 0 ? 1 : 0;
}

export function suggestJudgment(defects: number, plan: { acceptnum: number }): number {
  return defects <= plan.acceptnum ? JUDGMENT.ACCEPTED : JUDGMENT.REJECTED;
}

export interface JudgmentProblemInput {
  judgment: number;
  defects: number;
  ngCells: number;
  plan: { acceptnum: number; rejectnum: number };
  note: string | null;
}

export interface JudgmentProblem {
  field: string;
  message: string;
}

export function judgmentProblems(input: JudgmentProblemInput): JudgmentProblem[] {
  const { judgment, defects, ngCells, plan, note } = input;
  const problems: JudgmentProblem[] = [];
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
