const {
  COLUMN_NUMBERS,
  HEADER_COLUMNS,
  LINE_COLUMNS,
  INSPECT_TYPE_ORDER,
  normalizeInspectType,
  INSPECT_CATEGORY,
  INSPECT_CATEGORY_MARK,
  JUDGMENT,
  JUDGMENT_MARK,
} = require('../../constants/inspection');

describe('inspection constants', () => {
  it('numbers the 7 delivery columns 1..7', () => {
    expect(COLUMN_NUMBERS).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('builds the real csi_db column names', () => {
    expect(HEADER_COLUMNS.purchordernum[0]).toBe('purchordernum1');
    expect(HEADER_COLUMNS.qty_received[6]).toBe('qty_received7');
    expect(HEADER_COLUMNS.judgment).toHaveLength(7);
    expect(LINE_COLUMNS.actual).toEqual([
      'actual_1',
      'actual_2',
      'actual_3',
      'actual_4',
      'actual_5',
      'actual_6',
      'actual_7',
    ]);
    expect(LINE_COLUMNS.status[3]).toBe('status_4');
  });

  it('cannot be changed at runtime', () => {
    expect(Object.isFrozen(HEADER_COLUMNS)).toBe(true);
    expect(Object.isFrozen(HEADER_COLUMNS.purchordernum)).toBe(true);
    expect(Object.isFrozen(LINE_COLUMNS.actual)).toBe(true);
    expect(Object.isFrozen(JUDGMENT)).toBe(true);
  });

  it.each([
    ['STD', 'STD'],
    ['FITTING ', 'FITTING'],
    ['VISUAL ', 'VISUAL'],
    ['certifikat', 'CERTIFIKAT'],
  ])('normalizes inspecttype %j to %j', (raw, expected) => {
    expect(normalizeInspectType(raw)).toBe(expected);
  });

  it.each([['ROUGHNESS'], [''], [null], [undefined]])('returns null for %j', (raw) => {
    expect(normalizeInspectType(raw)).toBeNull();
  });

  it('orders rows like the paper form', () => {
    expect(INSPECT_TYPE_ORDER).toEqual(['STD', 'CERTIFIKAT', 'VISUAL', 'FITTING']);
  });

  it('has a form mark for every code and no duplicate codes', () => {
    for (const [codes, marks] of [
      [INSPECT_CATEGORY, INSPECT_CATEGORY_MARK],
      [JUDGMENT, JUDGMENT_MARK],
    ]) {
      const values = Object.values(codes);
      expect(new Set(values).size).toBe(values.length);
      expect(Object.keys(marks).map(Number).sort()).toEqual([...values].sort());
    }
  });
});
