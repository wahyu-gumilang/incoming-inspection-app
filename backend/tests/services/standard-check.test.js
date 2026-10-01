const {
  WARNING,
  standardWarnings,
  parseToleranceText,
  singleNumber,
} = require('../../services/standard-check');

const std = (fields) => ({
  inspecttype: 'STD',
  standard_txt: '',
  standard: 10,
  tolerance: '±0.4',
  tolerance_plus: 0.4,
  tolerance_minus: 0.4,
  ...fields,
});

describe('standardWarnings', () => {
  it('has nothing to say about a clean standard', () => {
    expect(standardWarnings(std({ standard_txt: ' 12.5', standard: 12.5 }))).toEqual([]);
    expect(
      standardWarnings(
        std({
          standard_txt: 'Ø16',
          standard: 16,
          tolerance: '+0.3/-0',
          tolerance_plus: 0.3,
          tolerance_minus: 0,
        }),
      ),
    ).toEqual([]);
    expect(
      standardWarnings(
        std({
          standard_txt: '1200 N/mm²',
          standard: 1200,
          tolerance: 'Min',
          tolerance_plus: 0,
          tolerance_minus: 0,
        }),
      ),
    ).toEqual([]);
  });

  it('flags a standard without limits ("No Coil")', () => {
    expect(
      standardWarnings(
        std({
          standard_txt: 'No Coil ',
          standard: 0,
          tolerance: ' 0.0',
          tolerance_plus: 0,
          tolerance_minus: 0,
        }),
      ),
    ).toEqual([WARNING.NO_LIMITS]);
  });

  it('flags a qualitative tolerance ("Tidak Terangkat")', () => {
    expect(
      standardWarnings(
        std({
          standard_txt: '50x',
          standard: 50,
          tolerance: 'Tidak Terangkat',
          tolerance_plus: 0,
          tolerance_minus: 0,
        }),
      ),
    ).toEqual([WARNING.QUALITATIVE_TOLERANCE]);
  });

  it('flags a negative tolerance (1-1-29-04 / C)', () => {
    const w = standardWarnings(
      std({
        standard_txt: ' 5.0',
        standard: 5,
        tolerance: '-0.5/-0',
        tolerance_plus: 0,
        tolerance_minus: -5,
      }),
    );
    expect(w).toContain(WARNING.NEGATIVE_TOLERANCE);
  });

  it('flags a tolerance text that disagrees with the numbers (1074-253 / A)', () => {
    expect(
      standardWarnings(
        std({
          standard_txt: ' 36.0',
          standard: 36,
          tolerance: '±0.3',
          tolerance_plus: 0.3,
          tolerance_minus: 1.3,
        }),
      ),
    ).toEqual([WARNING.TOLERANCE_TEXT_MISMATCH]);
  });

  it('flags a printed standard 100× off (1-1-12-05-1 Gloss)', () => {
    expect(
      standardWarnings(
        std({
          standard_txt: ' 0.7',
          standard: 70,
          tolerance: 'Max',
          tolerance_plus: 0,
          tolerance_minus: 0,
        }),
      ),
    ).toEqual([WARNING.STANDARD_TEXT_MISMATCH]);
  });

  it('only checks STD rows', () => {
    expect(
      standardWarnings(
        std({ inspecttype: 'VISUAL ', tolerance: ' 0.0', tolerance_plus: 0, tolerance_minus: 0 }),
      ),
    ).toEqual([]);
  });
});

describe('text parsers', () => {
  it.each([
    ['±0.4', { plus: 0.4, minus: 0.4 }],
    ['+0.3/-0', { plus: 0.3, minus: 0 }],
    ['+ 0.25 / - 0.15', { plus: 0.25, minus: 0.15 }],
    ['Min', null],
    ['Tidak Terangkat', null],
  ])('parseToleranceText(%j)', (t, expected) => expect(parseToleranceText(t)).toEqual(expected));

  it.each([
    ['Ø16', 16],
    [' 12.5', 12.5],
    ['1219 mm', 1219],
    ['0,4 mm', 0.4],
    ['SUS 201 and SUS 304', null],
    ['M8', null],
  ])('singleNumber(%j)', (t, expected) => expect(singleNumber(t)).toBe(expected));
});
