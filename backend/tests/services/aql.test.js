const { findPlanRow, rowProblems } = require('../../services/aql');
const { INSPECT_CATEGORY } = require('../../constants/inspection');

const { FULL, NORMAL: N, REDUCE: R, TIGHTENING: T } = INSPECT_CATEGORY;
const row = (inspectcategory, lotmin, lotmax, codeletter, samplesize, acceptnum, rejectnum) => ({
  inspectcategory,
  lotmin,
  lotmax,
  codeletter,
  samplesize,
  acceptnum,
  rejectnum,
});

// Same rows as migration 011.
const S1 = [
  row(N, 2, 50, 'A', 2, 0, 1),
  row(N, 51, 500, 'B', 3, 0, 1),
  row(N, 501, 35000, 'C', 5, 0, 1),
  row(N, 35001, null, 'D', 8, 0, 1),
  row(T, 2, 50, 'B', 3, 0, 1),
  row(T, 51, 500, 'C', 5, 0, 1),
  row(T, 501, 35000, 'D', 8, 0, 1),
  row(T, 35001, null, 'E', 13, 0, 1),
  row(R, 2, 50, 'A', 2, 0, 1),
  row(R, 51, 500, 'A', 2, 0, 1),
  row(R, 501, 35000, 'B', 3, 0, 1),
  row(R, 35001, null, 'C', 5, 0, 1),
];
const G2 = [
  row(N, 2, 50, 'C', 5, 0, 1),
  row(N, 51, 150, 'F', 20, 1, 2),
  row(N, 151, 280, 'G', 32, 2, 3),
  row(N, 281, 500, 'H', 50, 3, 4),
  row(N, 501, 1200, 'J', 80, 5, 6),
  row(N, 1201, 3200, 'K', 125, 7, 8),
  row(N, 3201, 10000, 'L', 200, 10, 11),
  row(N, 10001, 35000, 'M', 315, 14, 15),
  row(N, 35001, null, 'N', 500, 21, 22),
];

const short = (r) =>
  r && `${r.samplesize}/${r.acceptnum}/${r.rejectnum}${r.fullInspection ? ' 100%' : ''}`;

describe('findPlanRow, S-1 zero defects (default plan)', () => {
  it('matches the filled check sheet: lot 20 and 50 → 2 pcs, lot 100 → 3 pcs', () => {
    expect([20, 50, 100].map((lot) => findPlanRow(S1, lot, N).samplesize)).toEqual([2, 2, 3]);
  });

  it.each([
    [3, N, '2/0/1'],
    [50, N, '2/0/1'],
    [51, N, '3/0/1'],
    [500, N, '3/0/1'],
    [501, N, '5/0/1'],
    [35000, N, '5/0/1'],
    [35001, N, '8/0/1'],
    [1000000, N, '8/0/1'],
    [100, T, '5/0/1'],
    [600, T, '8/0/1'],
    [100, R, '2/0/1'],
    [600, R, '3/0/1'],
  ])('lot %i, category %i → %s', (lot, cat, expected) =>
    expect(short(findPlanRow(S1, lot, cat))).toBe(expected),
  );

  it('inspects everything when the lot is below the first range or not bigger than the sample', () => {
    expect(short(findPlanRow(S1, 1, N))).toBe('1/0/1 100%');
    expect(short(findPlanRow(S1, 2, N))).toBe('2/0/1 100%');
    expect(short(findPlanRow(S1, 3, T))).toBe('3/0/1 100%');
  });

  it('category 0 means 100 % inspection', () => {
    expect(findPlanRow(S1, 7, FULL)).toEqual({
      codeletter: '-',
      samplesize: 7,
      acceptnum: 0,
      rejectnum: 1,
      fullInspection: true,
    });
  });

  it('refuses a lot that is not a positive whole number', () => {
    expect(() => findPlanRow(S1, 0, N)).toThrow(RangeError);
    expect(() => findPlanRow(S1, 2.5, N)).toThrow(RangeError);
  });
});

describe('findPlanRow, General Level II AQL 2.5', () => {
  it.each([
    [3, '3/0/1 100%'],
    [50, '5/0/1'],
    [90, '20/1/2'],
    [151, '32/2/3'],
    [1000, '80/5/6'],
    [10000, '200/10/11'],
    [50000, '500/21/22'],
  ])('lot %i → %s', (lot, expected) => expect(short(findPlanRow(G2, lot, N))).toBe(expected));

  it('returns null for a category the plan has no rows for', () => {
    expect(findPlanRow(G2, 100, T)).toBeNull();
  });
});

describe('rowProblems', () => {
  const fields = (rows) => rowProblems(rows).map((p) => `${p.field}: ${p.message}`);

  it('accepts the seeded plans', () => {
    [N, R, T].forEach((c) =>
      expect(rowProblems(S1.filter((r) => r.inspectcategory === c))).toEqual([]),
    );
    expect(rowProblems(G2)).toEqual([]);
  });

  it('finds overlaps and gaps, pointing at the later row', () => {
    expect(fields([row(N, 2, 50, 'A', 2, 0, 1), row(N, 40, null, 'B', 3, 0, 1)])).toEqual([
      'rows.1.lotmin: overlaps the range 2–50',
    ]);
    expect(fields([row(N, 2, 50, 'A', 2, 0, 1), row(N, 60, null, 'B', 3, 0, 1)])).toEqual([
      'rows.1.lotmin: leaves lots 51–59 without a row',
    ]);
  });

  it('allows only the last range to be open-ended', () => {
    expect(fields([row(N, 2, null, 'A', 2, 0, 1), row(N, 51, null, 'B', 3, 0, 1)])).toEqual([
      'rows.0.lotmax: only the last range may be open-ended',
    ]);
  });

  it('checks Ac < Re and Ac < sample size and lot to ≥ lot from', () => {
    expect(fields([row(N, 2, 1, 'A', 2, 2, 2)])).toEqual([
      'rows.0.lotmax: must be ≥ lot from (2)',
      'rows.0.rejectnum: must be greater than Ac (2)',
      'rows.0.acceptnum: must be smaller than the sample size (2)',
    ]);
  });
});
