import { describe, expect, it } from 'vitest';
import {
  InspectionDetail,
  InspectionLine,
  InspectionOtherLine,
} from '../../../core/models/inspection';
import { JUDGMENT, LINE_STATUS } from '../../../shared/judgement';
import {
  buildDraft,
  countNgCells,
  deliveryPayload,
  headerProblems,
  judgmentChoices,
  resultProblems,
  stdStatus,
  suggestedJudgment,
} from './delivery-dialog.model';

const NULLS = {
  actual_1: null,
  actual_2: null,
  actual_3: null,
  actual_4: null,
  actual_5: null,
  actual_6: null,
  actual_7: null,
  status_1: null,
  status_2: null,
  status_3: null,
  status_4: null,
  status_5: null,
  status_6: null,
  status_7: null,
};

function line(overrides: Partial<InspectionLine> = {}): InspectionLine {
  return {
    inspectnum: 'INS-000003',
    linenum: 1,
    inspecttype: 'STD',
    inspectitem: 'A',
    standard_txt: '12.5',
    standard: 12.5,
    tolerance: 0.4,
    tolerance_txt: '0.4',
    tolerance_plus: 0.4,
    tolerance_minus: 0.4,
    ...NULLS,
    mode: 'RANGE',
    ...overrides,
  } as InspectionLine;
}

function otherLine(overrides: Partial<InspectionOtherLine> = {}): InspectionOtherLine {
  return {
    inspectnum: 'INS-000003',
    linenum: 10,
    inspecttype: 'VISUAL',
    inspectitem: 'Black',
    standard_txt: null,
    actual_txt_1: null,
    actual_txt_2: null,
    actual_txt_3: null,
    actual_txt_4: null,
    actual_txt_5: null,
    actual_txt_6: null,
    actual_txt_7: null,
    status_1: null,
    status_2: null,
    status_3: null,
    status_4: null,
    status_5: null,
    status_6: null,
    status_7: null,
    ...overrides,
  };
}

const detail: InspectionDetail = {
  inspectnum: 'INS-000003',
  inspectdate: '2026-10-01',
  itemid: '000-228',
  itemname: 'Handle Rhino Prima',
  accountnum: 'V-0001',
  name: 'PT Sinar Logam Abadi',
  inspectstatus: 'DRAFT',
  instrument: 'Digital caliper',
  qfnum: 'QF 01-05',
  inspectby: 'Budi Santoso',
  inspectbyid: 2,
  checkedby: null,
  aqlplanid: 1,
  created_at: '2026-10-01T08:00:00.000Z',
  updated_at: '2026-10-01T08:00:00.000Z',
  deliveryCount: 1,
  totalReceived: 50,
  editable: true,
  deliveries: [
    {
      n: 1,
      used: true,
      purchordernum: '33932',
      deliverydate: '2026-09-15',
      qty_received: 50,
      inspectcategory: 1,
      notgood: 1,
      judgment: JUDGMENT.CONCESSION,
      concessionnote: 'Burr on B',
      samplesize: 2,
      acceptnum: 0,
      rejectnum: 1,
      ngCells: 1,
      suggestedJudgment: JUDGMENT.REJECTED,
    },
  ],
  lines: [
    line({
      linenum: 1,
      inspectitem: 'A',
      actual_1: 12.6,
      status_1: LINE_STATUS.OK,
    }),
    line({
      linenum: 2,
      inspectitem: 'B',
      standard_txt: 'Ø16',
      standard: 16,
      tolerance_txt: '+0.3/-0',
      tolerance_plus: 0.3,
      tolerance_minus: 0,
      actual_1: 16.35,
      status_1: LINE_STATUS.NG,
    }),
    line({
      linenum: 3,
      inspectitem: 'C',
      standard_txt: 'Tidak Terangkat',
      standard: 0,
      tolerance_txt: 'Tidak Terangkat',
      tolerance_plus: 0,
      tolerance_minus: 0,
      mode: 'MANUAL',
      status_1: LINE_STATUS.OK,
    }),
  ],
  otherLines: [
    otherLine({ linenum: 10, inspecttype: 'VISUAL', status_1: LINE_STATUS.OK }),
    otherLine({
      linenum: 11,
      inspecttype: 'CERTIFIKAT',
      inspectitem: 'COA',
      actual_txt_1: 'COA-123',
      status_1: LINE_STATUS.OK,
    }),
  ],
};

const plan = {
  planid: 1,
  lot: 50,
  inspectcategory: 1,
  codeletter: 'A',
  samplesize: 2,
  acceptnum: 0,
  rejectnum: 1,
  fullInspection: false,
};

describe('delivery dialog model', () => {
  it('reads an existing column back into the draft', () => {
    const draft = buildDraft(detail, 1);

    expect(draft.isNew).toBe(false);
    expect(draft).toMatchObject({
      n: 1,
      purchordernum: '33932',
      deliverydate: '2026-09-15',
      qty: '50',
      inspectcategory: 1,
      notgood: 1,
      judgment: JUDGMENT.CONCESSION,
      note: 'Burr on B',
    });
    expect(draft.std.map((l) => l.actual)).toEqual(['12.6', '16.35', '']);
    expect(draft.std.map((l) => l.mode)).toEqual(['RANGE', 'RANGE', 'MANUAL']);
    expect(draft.other.map((l) => l.actualTxt)).toEqual(['', 'COA-123']);
  });

  it('starts the next column blank, with visual and fitting OK', () => {
    const draft = buildDraft(detail, 2);

    expect(draft.isNew).toBe(true);
    expect(draft.purchordernum).toBe('');
    expect(draft.qty).toBe('');
    expect(draft.inspectcategory).toBe(1);
    expect(draft.notgood).toBe(0);
    expect(draft.judgment).toBe(JUDGMENT.NOT_JUDGED);
    expect(draft.std.every((l) => l.actual === '')).toBe(true);
    expect(draft.other.every((l) => l.status === LINE_STATUS.OK)).toBe(true);
  });

  it('judges range lines in hundredths and keeps MANUAL statuses', () => {
    const draft = buildDraft(detail, 1);
    const [first, second, third] = draft.std;

    expect(stdStatus(first)).toBe(LINE_STATUS.OK);
    expect(stdStatus(second)).toBe(LINE_STATUS.NG);
    expect(stdStatus({ ...third, manualStatus: LINE_STATUS.NG })).toBe(LINE_STATUS.NG);
    expect(stdStatus({ ...first, actual: '' })).toBeNull();
  });

  it('builds the PUT body with null for empty actuals', () => {
    const draft = buildDraft(detail, 1);
    const payload = deliveryPayload(draft);

    expect(payload).toMatchObject({
      purchordernum: '33932',
      deliverydate: '2026-09-15',
      qty_received: 50,
      inspectcategory: 1,
      notgood: 1,
      judgment: JUDGMENT.CONCESSION,
      concessionnote: 'Burr on B',
    });
    expect(payload.lines).toEqual([
      { linenum: 1, actual: '12.6', status: LINE_STATUS.OK },
      { linenum: 2, actual: '16.35', status: LINE_STATUS.NG },
      { linenum: 3, actual: null, status: LINE_STATUS.OK },
    ]);
    expect(payload.otherLines[1]).toEqual({
      linenum: 11,
      actual_txt: 'COA-123',
      status: LINE_STATUS.OK,
    });
  });

  it('counts NG cells, not pieces', () => {
    expect(countNgCells(buildDraft(detail, 1))).toBe(1);
  });

  it('checks the header fields of step 1', () => {
    const draft = buildDraft(detail, 2);
    expect(headerProblems(draft)).toEqual(
      expect.arrayContaining([
        'P/O No. is required.',
        'QTY received must be a whole number of at least 1.',
      ]),
    );
  });

  it('mirrors the server judgment rules', () => {
    const draft = { ...buildDraft(detail, 1), notgood: 2, judgment: JUDGMENT.ACCEPTED };

    expect(resultProblems(draft, plan).join(' ')).toContain("can't be Accepted");
    expect(
      resultProblems({ ...draft, judgment: JUDGMENT.CONCESSION, note: '' }, plan).join(' '),
    ).toContain('required for a Concession');
    expect(resultProblems({ ...draft, notgood: 3 }, plan).join(' ')).toContain(
      "can't exceed the sample size",
    );
    expect(resultProblems({ ...draft, notgood: 0 }, plan).join(' ')).toContain(
      'at least 1 piece is defective',
    );
  });

  it('disables Accepted above Ac and Concession without a note or below Re', () => {
    const choices = judgmentChoices(plan, 1, '');
    expect(choices.find((c) => c.value === JUDGMENT.ACCEPTED)?.enabled).toBe(false);
    expect(choices.find((c) => c.value === JUDGMENT.REJECTED)?.enabled).toBe(true);
    expect(choices.find((c) => c.value === JUDGMENT.CONCESSION)?.enabled).toBe(true);
    expect(judgmentChoices(plan, 1, 'PPIC ok')[2].enabled).toBe(true);
    expect(judgmentChoices(plan, 0, '')[2].enabled).toBe(false);
    expect(suggestedJudgment(plan, 0)).toBe(JUDGMENT.ACCEPTED);
    expect(suggestedJudgment(plan, 1)).toBe(JUDGMENT.REJECTED);
  });
});
