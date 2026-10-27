import { AqlLookup } from '../../../core/models/aql';
import {
  InspectionDetail,
  InspectionOtherLine,
  Judgment,
  LineStatus,
  InspectCategory,
} from '../../../core/models/inspection';
import {
  JUDGMENT,
  LINE_STATUS,
  RULE_MODE,
  Rule,
  judgeValue,
  judgmentProblems,
  ruleMode,
  suggestJudgment,
} from '../../../shared/judgement';
import { DeliveryInput } from '../inspection.service';
import { INSPECT_CATEGORY, todayIso, toleranceTextOf } from '../inspection.model';

/** One dimension row of the delivery modal (the input side of an STD line). */
export interface StdLineDraft {
  linenum: number;
  label: string;
  standardTxt: string;
  toleranceText: string;
  rule: Rule;
  mode: string;
  actual: string;
  /** OK/NG chosen by the inspector; only used for MANUAL rules. */
  manualStatus: LineStatus;
}

/** One visual / fitting / certificate row of the delivery modal. */
export interface OtherLineDraft {
  linenum: number;
  type: string;
  label: string;
  standardTxt: string;
  actualTxt: string;
  status: LineStatus;
}

export interface DeliveryDraft {
  n: number;
  isNew: boolean;
  purchordernum: string;
  deliverydate: string;
  qty: string;
  inspectcategory: InspectCategory;
  std: StdLineDraft[];
  other: OtherLineDraft[];
  notgood: number;
  judgment: Judgment;
  note: string;
}

export interface JudgmentChoice {
  value: Judgment;
  mark: string;
  label: string;
  enabled: boolean;
  hint?: string;
}

function columnValue<T>(row: object, prefix: string, n: number): T | null {
  return (row as unknown as Record<string, T | null>)[`${prefix}${n}`] ?? null;
}

/** Builds the modal's draft from a saved column, or a blank one for the next column. */
export function buildDraft(detail: InspectionDetail, n: number): DeliveryDraft {
  const stored = detail.deliveries.find((d) => d.n === n && d.used);
  const isNew = !stored;

  const std: StdLineDraft[] = detail.lines.map((l) => {
    const rule: Rule = {
      standard: l.standard,
      text: l.tolerance_txt,
      plus: l.tolerance_plus,
      minus: l.tolerance_minus,
    };
    const actual = columnValue<number>(l, 'actual_', n);
    return {
      linenum: l.linenum,
      label: l.inspectitem.trim(),
      standardTxt: l.standard_txt?.trim() || (l.standard === null ? '' : String(l.standard)),
      toleranceText: toleranceTextOf(l),
      rule,
      mode: l.mode ?? ruleMode(rule),
      actual: actual === null ? '' : String(actual),
      manualStatus: columnValue<LineStatus>(l, 'status_', n),
    };
  });

  const other: OtherLineDraft[] = detail.otherLines.map((l: InspectionOtherLine) => ({
    linenum: l.linenum,
    type: l.inspecttype.trim().toUpperCase(),
    label: l.inspectitem.trim(),
    standardTxt: l.standard_txt?.trim() ?? '',
    actualTxt: columnValue<string>(l, 'actual_txt_', n) ?? '',
    // A new delivery starts from OK, like the approved mockup: the inspector
    // only touches the values that are actually bad. A saved column keeps
    // whatever was stored (NULL still means "not measured").
    status: isNew ? LINE_STATUS.OK : columnValue<LineStatus>(l, 'status_', n),
  }));

  return {
    n,
    isNew,
    purchordernum: stored?.purchordernum ?? '',
    deliverydate: stored?.deliverydate ?? todayIso(),
    qty: stored?.qty_received ? String(stored.qty_received) : '',
    inspectcategory: stored?.inspectcategory ?? INSPECT_CATEGORY.NORMAL,
    std,
    other,
    notgood: stored?.notgood ?? 0,
    judgment: stored?.judgment ?? JUDGMENT.NOT_JUDGED,
    note: stored?.concessionnote ?? '',
  };
}

/** status_N of a dimension row, recalculated in hundredths like the server. */
export function stdStatus(line: StdLineDraft): LineStatus {
  if (line.mode === RULE_MODE.MANUAL) return line.manualStatus;
  try {
    return judgeValue(line.rule, line.actual) as LineStatus;
  } catch {
    return null;
  }
}

/** Number of NG cells in the column (not defective pieces). */
export function countNgCells(draft: DeliveryDraft): number {
  const std = draft.std.filter((l) => stdStatus(l) === LINE_STATUS.NG).length;
  const other = draft.other.filter((l) => l.status === LINE_STATUS.NG).length;
  return std + other;
}

/** The PUT /inspections/:num/deliveries/:n body. */
export function deliveryPayload(draft: DeliveryDraft): DeliveryInput {
  const actual = (value: string): string | null => {
    const text = value.trim().replace(',', '.');
    return text === '' ? null : text;
  };

  return {
    purchordernum: draft.purchordernum.trim(),
    deliverydate: draft.deliverydate,
    qty_received: Number(draft.qty),
    inspectcategory: draft.inspectcategory,
    lines: draft.std.map((l) => ({
      linenum: l.linenum,
      actual: actual(l.actual),
      status: stdStatus(l),
    })),
    otherLines: draft.other.map((l) => ({
      linenum: l.linenum,
      actual_txt: l.actualTxt.trim() || null,
      status: l.status,
    })),
    notgood: draft.notgood,
    judgment: draft.judgment,
    concessionnote: draft.note,
  };
}

/** Step 1 checks: the server's delivery header rules. */
export function headerProblems(draft: DeliveryDraft): string[] {
  const problems: string[] = [];
  if (!draft.purchordernum.trim()) problems.push('P/O No. is required.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.deliverydate))
    problems.push('Delivery date must be a real date.');
  const qty = Number(draft.qty);
  if (!Number.isInteger(qty) || qty < 1)
    problems.push('QTY received must be a whole number of at least 1.');
  return problems;
}

/** Step 3 checks, mirroring services/inspection.service.js (422 details). */
export function resultProblems(draft: DeliveryDraft, plan: AqlLookup | null): string[] {
  if (!plan) return ['Sample size is not available. Enter the QTY received first.'];

  const problems: string[] = [];
  if (draft.notgood > plan.samplesize)
    problems.push(`NG pieces can't exceed the sample size (${plan.samplesize}).`);
  for (const problem of judgmentProblems({
    judgment: draft.judgment,
    defects: draft.notgood,
    ngCells: countNgCells(draft),
    plan,
    note: draft.note,
  })) {
    problems.push(problem.message);
  }
  return problems;
}

/** O / X / C with the same enabled rules as the server. */
export function judgmentChoices(
  plan: AqlLookup | null,
  defects: number,
  note: string,
): JudgmentChoice[] {
  const overAc = plan !== null && defects > plan.acceptnum;
  const atRe = plan !== null && defects >= plan.rejectnum;
  return [
    {
      value: JUDGMENT.ACCEPTED,
      mark: 'O',
      label: 'Accepted',
      enabled: plan !== null && !overAc,
      hint: overAc ? `NG ${defects} exceeds Ac ${plan.acceptnum}` : undefined,
    },
    {
      value: JUDGMENT.REJECTED,
      mark: 'X',
      label: 'Rejected',
      enabled: plan !== null,
    },
    {
      value: JUDGMENT.CONCESSION,
      mark: 'C',
      label: 'Concession',
      // The note box only appears once C is chosen, so a missing note can't
      // disable the button here; resultProblems() blocks the save instead.
      enabled: plan !== null && atRe,
      hint:
        plan === null
          ? undefined
          : !atRe
            ? `Only when NG ≥ Re ${plan.rejectnum}`
            : !note.trim()
              ? 'A note is required'
              : undefined,
    },
  ];
}

/** What the system suggests before the inspector decides. */
export function suggestedJudgment(plan: AqlLookup | null, defects: number): Judgment | null {
  return plan ? (suggestJudgment(defects, plan) as Judgment) : null;
}

export function ngHint(draft: DeliveryDraft): string {
  const cells = countNgCells(draft);
  if (cells === 0) return 'All values in step 2 are OK.';
  return `Step 2 has ${cells} NG value${cells > 1 ? 's' : ''}, so at least 1 piece is defective. Count pieces, not values.`;
}

/** Rows of one line type (Certificate / Visual / Fitting) for step 2. */
export function linesOfType(draft: DeliveryDraft, type: string): OtherLineDraft[] {
  return draft.other.filter((l) => l.type === type);
}
