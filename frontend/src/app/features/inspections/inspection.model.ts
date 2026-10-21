import {
  DeliveryInfo,
  InspectionDetail,
  InspectionLine,
  InspectionListItem,
  InspectionOtherLine,
  Judgment,
  LineStatus,
} from '../../core/models/inspection';

export type {
  DeliveryInfo,
  InspectionDetail,
  InspectionLine,
  InspectionListItem,
  InspectionOtherLine,
  Judgment,
  LineStatus,
};

export interface NewInspectionInput {
  itemid: string;
  accountnum: string;
  inspectdate: string;
  instrument?: string | null;
  qfnum?: string | null;
}

export const JudgmentLabel: Record<number, string> = {
  0: '—',
  1: 'O · Accepted',
  2: 'X · Rejected',
  3: 'C · Concession',
};

export const JudgmentMark: Record<number, string> = {
  0: '—',
  1: 'O',
  2: 'X',
  3: 'C',
};

export const InspectionStatusLabel: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Waiting for check',
  CHECKED: 'Checked',
};

export const CATEGORY_LABEL: Record<number, string> = {
  0: '100 %',
  1: 'N',
  2: 'R',
  3: 'T',
};

export const CATEGORIES: { value: 0 | 1 | 2 | 3; mark: string; name: string }[] = [
  { value: 1, mark: 'N', name: 'Normal' },
  { value: 2, mark: 'R', name: 'Reduced' },
  { value: 3, mark: 'T', name: 'Tightening' },
];

export const COLUMN_COUNT = 7;
export const COLUMNS: number[] = [1, 2, 3, 4, 5, 6, 7];

// The order the form prints its rows: dimensions, then COA, visual, fitting.
export const TYPE_ORDER: Record<string, number> = {
  STD: 0,
  CERTIFIKAT: 1,
  VISUAL: 2,
  FITTING: 3,
};

export const TYPE_LABEL: Record<string, string> = {
  STD: 'STD',
  CERTIFIKAT: 'Certificate (COA)',
  VISUAL: 'Visual',
  FITTING: 'Fitting',
};

export const CATEGORY_NAME: Record<number, string> = {
  0: '100 % inspection',
  1: 'Normal',
  2: 'Reduced',
  3: 'Tightening',
};

/** One row of the check sheet, in the order the form prints it. */
export interface CheckSheetRow {
  kind: 'std' | 'other';
  linenum: number;
  type: string; // 'STD' | 'CERTIFIKAT' | 'VISUAL' | 'FITTING'
  label: string; // inspectitem, trimmed
  standardTxt: string;
  toleranceText: string; // '±x', '+x / −y', 'Min', 'Max' or ''
  standard: number | null;
  plus: number | null;
  minus: number | null;
  /** The judging mode the server computes: RANGE | MIN | MAX | MANUAL. */
  mode: string;
  actual(n: number): number | string | null;
  status(n: number): LineStatus;
}

/** Builds the displayed rows from a detail, mirroring the form's print order. */
export function buildCheckSheet(detail: InspectionDetail): CheckSheetRow[] {
  const rows: CheckSheetRow[] = [];

  for (const l of detail.lines) {
    rows.push({
      kind: 'std',
      linenum: l.linenum,
      type: l.inspecttype,
      label: l.inspectitem.trim(),
      standardTxt: l.standard_txt?.trim() ?? '',
      toleranceText: toleranceTextOf(l),
      standard: l.standard,
      plus: l.tolerance_plus,
      minus: l.tolerance_minus,
      mode: l.mode ?? '',
      actual: (n) => l[`actual_${n}` as keyof InspectionLine] ?? null,
      status: (n) => (l[`status_${n}` as keyof InspectionLine] ?? null) as LineStatus,
    });
  }

  for (const l of detail.otherLines) {
    rows.push({
      kind: 'other',
      linenum: l.linenum,
      type: l.inspecttype,
      label: l.inspectitem.trim(),
      standardTxt: l.standard_txt?.trim() ?? '',
      toleranceText: '',
      standard: null,
      plus: null,
      minus: null,
      mode: 'MANUAL',
      actual: (n) => l[`actual_txt_${n}` as keyof InspectionOtherLine] ?? null,
      status: (n) => (l[`status_${n}` as keyof InspectionOtherLine] ?? null) as LineStatus,
    });
  }

  return rows;
}

/** '±0.1', '+0.3 / −0', 'Min', 'Max' — read from the stored snapshot. */
export function toleranceTextOf(l: {
  tolerance_txt: string | null;
  tolerance_plus: number | null;
  tolerance_minus: number | null;
}): string {
  const t = l.tolerance_txt?.trim();
  const plus = l.tolerance_plus;
  const minus = l.tolerance_minus;
  if (
    t &&
    Number(t) !== 0 &&
    plus !== null &&
    minus !== null &&
    plus === minus &&
    Number(t) === plus
  )
    return `±${t}`;
  if (t && Number(t) !== 0 && plus !== null && minus !== null) return `+${plus} / −${minus}`;
  return t || '';
}

/** True when the column carries an AQL plan (filled, or still being filled). */
export function hasPlan(detail: InspectionDetail, n: number): boolean {
  const d = detail.deliveries.find((x) => x.n === n);
  return Boolean(d && d.samplesize !== null && d.acceptnum !== null && d.rejectnum !== null);
}

/** Number of NG cells in one column, live. */
export function countColumnNg(detail: InspectionDetail, n: number): number {
  const rows = buildCheckSheet(detail);
  return rows.reduce((sum, r) => (r.status(n) === 0 ? sum + 1 : sum), 0);
}

export interface JudgmentOption {
  value: 0 | 1 | 2 | 3;
  mark: string;
  label: string;
  enabled: boolean;
  hint?: string;
}

/**
 * The O / X / C choices with the server's rules mirrored: Accepted only up to Ac,
 * Concession only from Re with a note, X always allowed for a filled column.
 */
export function judgmentOptions(
  detail: InspectionDetail,
  n: number,
  notgood: number,
  note: string,
): JudgmentOption[] {
  const d = detail.deliveries.find((x) => x.n === n);
  const plan = d?.used && hasPlan(detail, n) ? d : null;
  const ac = plan ? (plan.acceptnum as number) : Infinity;
  const re = plan ? (plan.rejectnum as number) : Infinity;
  const overAc = notgood > ac;
  const atRe = notgood >= re;

  return [
    {
      value: 1,
      mark: 'O',
      label: 'Accepted',
      enabled: Boolean(plan) && !overAc,
      hint: plan ? (overAc ? `NG ${notgood} exceeds Ac ${ac}` : undefined) : 'Lot not set yet',
    },
    {
      value: 2,
      mark: 'X',
      label: 'Rejected',
      enabled: Boolean(plan),
      hint: plan ? undefined : 'Lot not set yet',
    },
    {
      value: 3,
      mark: 'C',
      label: 'Concession',
      enabled: Boolean(plan) && atRe && note.trim().length > 0,
      hint: plan
        ? !atRe
          ? `Only when NG ≥ Re ${re}`
          : !note.trim()
            ? 'Note is required'
            : undefined
        : 'Lot not set yet',
    },
  ];
}

export function todayIso(): string {
  const off = new Date().getTimezoneOffset();
  const local = new Date(Date.now() - off * 60000);
  return local.toISOString().slice(0, 10);
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return [d, m, y].filter(Boolean).join('/');
}
