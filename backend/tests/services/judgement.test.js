const j = require('../../services/judgement');
const { LINE_STATUS, JUDGMENT } = require('../../constants/inspection');

const { OK, NG } = LINE_STATUS;
const rule = (standard, text, plus, minus) => ({ standard, text, plus, minus });

// Real rules from csi_db
const A = rule(12.5, '±0.4', 0.4, 0.4); // 000-228 / A
const B = rule(16, '+0.3/-0', 0.3, 0); // 000-228 / B
const MINUS_ONLY = rule(20.5, '+0/-0.1', 0, 0.1); // like 3-1-12-05 / B
const TENSILE = rule(1200, 'Min', 0, 0); // 1-1-14-39 Tensile Strength
const LUMPUR = rule(10, 'Max', 0, 0); // 1-1-14-03 Kadar Lumpur
const NO_LIMITS = rule(0, ' 0.0', 0, 0); // "No Coil"
const QUALITATIVE = rule(50, 'Tidak Terangkat', 0, 0); // Rubtest

describe('toHundredths', () => {
  it.each([
    ['12.62', 1262],
    [12.62, 1262],
    ['12,62', 1262],
    ['12.9', 1290],
    [' 7 ', 700],
    ['-0.5', -50],
    [0.1 + 0.2, 30],
    [0, 0],
  ])('%j → %j', (input, expected) => expect(j.toHundredths(input)).toBe(expected));

  it.each([[''], [null], [undefined]])('%j is "not measured" (null)', (input) =>
    expect(j.toHundredths(input)).toBeNull(),
  );

  it.each([['12.625'], [12.625], ['abc'], ['12.'], ['1.2.3'], [NaN], [Infinity]])(
    '%j is invalid (undefined)',
    (input) => expect(j.toHundredths(input)).toBeUndefined(),
  );
});

describe('ruleMode', () => {
  it.each([
    [A, 'RANGE'],
    [B, 'RANGE'],
    [MINUS_ONLY, 'RANGE'],
    [TENSILE, 'MIN'],
    [rule(1200, 'Min ', 0, 0), 'MIN'],
    [rule(10, 'max', 0, 0), 'MAX'],
    [LUMPUR, 'MAX'],
    [NO_LIMITS, 'MANUAL'],
    [QUALITATIVE, 'MANUAL'],
    [rule(null, '±0.4', 0.4, 0.4), 'MANUAL'],
  ])('%j → %s', (r, mode) => expect(j.ruleMode(r)).toBe(mode));
});

describe('judgeValue', () => {
  it.each([
    // ±0.4 around 12.5 → 12.10 .. 12.90, limits included
    [A, '12.10', OK],
    [A, '12.90', OK],
    [A, '12.09', NG],
    [A, '12.91', NG],
    [A, '12.62', OK],
    // +0.3 / -0 around 16 → 16.00 .. 16.30
    [B, '16.00', OK],
    [B, '15.99', NG],
    [B, '16.30', OK],
    [B, '16.31', NG],
    [B, '16.35', NG],
    // +0 / -0.1 around 20.5 → 20.40 .. 20.50
    [MINUS_ONLY, '20.40', OK],
    [MINUS_ONLY, '20.39', NG],
    [MINUS_ONLY, '20.51', NG],
    // Min / Max
    [TENSILE, '1200', OK],
    [TENSILE, '1500', OK],
    [TENSILE, '1199.99', NG],
    [LUMPUR, '10.00', OK],
    [LUMPUR, '0.5', OK],
    [LUMPUR, '10.01', NG],
    // a negative standard
    [rule(-5, '±0.5', 0.5, 0.5), '-5.50', OK],
    [rule(-5, '±0.5', 0.5, 0.5), '-5.51', NG],
    // 0.3 + 0.1 is 0.4000000000000001 in floating point; must still be OK
    [rule(0.3, '±0.1', 0.1, 0.1), '0.4', OK],
    [rule(0.3, '±0.1', 0.1, 0.1), 0.2, OK],
    // numbers and strings judge the same
    [A, 12.9, OK],
  ])('%j with %j → %j', (r, actual, status) => expect(j.judgeValue(r, actual)).toBe(status));

  it('uses the size of a negative tolerance_minus (data-entry slip)', () => {
    const slip = rule(5, '-0.5/-0', 0, -5); // 1-1-29-04 / C as stored
    expect(j.limits(slip)).toMatchObject({ lower: 0, upper: 500 });
    expect(j.judgeValue(slip, '0.00')).toBe(OK);
  });

  it('returns null for an empty value: not measured is never NG', () => {
    expect(j.judgeValue(A, '')).toBeNull();
    expect(j.judgeValue(A, null)).toBeNull();
  });

  it('returns null for a MANUAL rule: the inspector decides', () => {
    expect(j.judgeValue(NO_LIMITS, '3')).toBeNull();
    expect(j.judgeValue(QUALITATIVE, '50')).toBeNull();
  });

  it('refuses an invalid measurement', () => {
    expect(() => j.judgeValue(A, 'abc')).toThrow(TypeError);
    expect(() => j.judgeValue(A, '12.625')).toThrow(TypeError);
  });
});

describe('judgeLine', () => {
  it('judges all 7 delivery columns and ignores statuses sent for a RANGE rule', () => {
    const actuals = ['12.62', '12.48', '12.95', '', null, '12.10', '12.90'];
    expect(j.judgeLine(A, actuals, [NG, NG, OK, OK, OK, NG, NG])).toEqual([
      OK,
      OK,
      NG,
      null,
      null,
      OK,
      OK,
    ]);
  });

  it("keeps the inspector's OK/NG for a MANUAL rule and drops anything else", () => {
    expect(
      j.judgeLine(NO_LIMITS, Array(7).fill(''), [OK, NG, null, 'OK', 2, undefined, OK]),
    ).toEqual([OK, NG, null, null, null, null, OK]);
  });
});

describe('countNgCells and minimumDefects', () => {
  it('counts NG cells per column across all lines', () => {
    const rows = [
      [OK, NG, null, null, null, null, null],
      [NG, NG, OK, null, null, null, null],
      [OK, OK, OK, null, null, null, null],
    ];
    expect(j.countNgCells(rows, 7)).toEqual([1, 2, 0, 0, 0, 0, 0]);
  });

  it('needs at least 1 defective piece when any cell is NG, however many cells', () => {
    expect(j.minimumDefects(0)).toBe(0);
    expect(j.minimumDefects(1)).toBe(1);
    expect(j.minimumDefects(3)).toBe(1);
  });
});

describe('suggestJudgment', () => {
  const zeroDefects = { samplesize: 2, acceptnum: 0, rejectnum: 1 }; // S-1, lot 50
  const aql25 = { samplesize: 20, acceptnum: 1, rejectnum: 2 }; // General II AQL 2.5, lot 51-150

  it.each([
    [0, zeroDefects, JUDGMENT.ACCEPTED],
    [1, zeroDefects, JUDGMENT.REJECTED],
    [1, aql25, JUDGMENT.ACCEPTED],
    [2, aql25, JUDGMENT.REJECTED],
  ])('%i defective with Ac %j', (defects, plan, expected) =>
    expect(j.suggestJudgment(defects, plan)).toBe(expected),
  );
});

describe('judgmentProblems', () => {
  const plan = { samplesize: 2, acceptnum: 0, rejectnum: 1 };
  const fields = (input) =>
    j.judgmentProblems({ plan, note: '', ngCells: 0, ...input }).map((p) => p.field);

  it('accepts a clean Accepted and a Rejected with defects', () => {
    expect(fields({ judgment: JUDGMENT.ACCEPTED, defects: 0 })).toEqual([]);
    expect(fields({ judgment: JUDGMENT.REJECTED, defects: 1, ngCells: 2 })).toEqual([]);
  });

  it('refuses Accepted above Ac', () => {
    expect(fields({ judgment: JUDGMENT.ACCEPTED, defects: 1, ngCells: 1 })).toEqual(['judgment']);
  });

  it('refuses 0 defective pieces while a value is NG', () => {
    expect(fields({ judgment: JUDGMENT.REJECTED, defects: 0, ngCells: 1 })).toEqual(['notgood']);
  });

  it('allows Concession only from Re and with a note', () => {
    expect(
      fields({
        judgment: JUDGMENT.CONCESSION,
        defects: 1,
        ngCells: 1,
        note: 'Burr on B, accepted by PPIC',
      }),
    ).toEqual([]);
    expect(fields({ judgment: JUDGMENT.CONCESSION, defects: 1, ngCells: 1, note: '  ' })).toEqual([
      'concessionnote',
    ]);
    expect(fields({ judgment: JUDGMENT.CONCESSION, defects: 0, note: 'x' })).toEqual(['judgment']);
  });
});
