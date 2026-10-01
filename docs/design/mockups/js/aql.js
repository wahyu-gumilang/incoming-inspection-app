// aql.js — AQL plans and lookup, shared by the AQL table page and the delivery modal.
// In the app these rows live in aqlplan / aqlplanrow and the server repeats the lookup on save.

// Rows: [lotMin, lotMax (null = no upper limit), code letter, sample size, Ac, Re]
const AQL_PLANS = {
  s1: {
    name: 'Current practice',
    sub: 'ISO 2859-1 Special Level S-1 · zero defects (Ac 0 / Re 1)',
    badge: 'Default',
    rows: {
      N: [[1, 1, '—', 1, 0, 1], [2, 50, 'A', 2, 0, 1], [51, 500, 'B', 3, 0, 1], [501, 35000, 'C', 5, 0, 1], [35001, null, 'D', 8, 0, 1]],
      T: [[1, 1, '—', 1, 0, 1], [2, 50, 'B', 3, 0, 1], [51, 500, 'C', 5, 0, 1], [501, 35000, 'D', 8, 0, 1], [35001, null, 'E', 13, 0, 1]],
      R: [[1, 1, '—', 1, 0, 1], [2, 50, 'A', 2, 0, 1], [51, 500, 'A', 2, 0, 1], [501, 35000, 'B', 3, 0, 1], [35001, null, 'C', 5, 0, 1]],
    },
  },
  g2: {
    name: 'ISO General Level II · AQL 2.5',
    sub: "From Pak Fajar's request · normal only · verify against the official standard",
    badge: 'Alternative',
    rows: {
      N: [
        [2, 50, 'C', 5, 0, 1], [51, 150, 'F', 20, 1, 2], [151, 280, 'G', 32, 2, 3], [281, 500, 'H', 50, 3, 4],
        [501, 1200, 'J', 80, 5, 6], [1201, 3200, 'K', 125, 7, 8], [3201, 10000, 'L', 200, 10, 11],
        [10001, 35000, 'M', 315, 14, 15], [35001, null, 'N', 500, 21, 22],
      ],
      T: null,
      R: null,
    },
  },
};

const DEFAULT_PLAN = 's1';

const CATEGORIES = {
  N: 'Normal',
  R: 'Reduced',
  T: 'Tightened',
  F: '100 % inspection',
};

// A lot smaller than the sample means every piece is inspected.
function aqlLookup(planKey, cat, lot) {
  lot = Number(lot);
  if (!Number.isInteger(lot) || lot < 1) return null;
  if (cat === 'F') return { letter: '—', n: lot, ac: 0, re: 1, full: true };
  const rows = AQL_PLANS[planKey].rows[cat];
  if (!rows) return null;
  const r = rows.find(([min, max]) => lot >= min && (max === null || lot <= max));
  if (!r) return { letter: '—', n: lot, ac: 0, re: 1, full: true };
  return { letter: r[2], n: Math.min(r[3], lot), ac: r[4], re: r[5], full: r[3] >= lot, row: r };
}

function fmtLot(min, max) {
  if (max === null) return `${min.toLocaleString('en')}+`;
  if (min === max) return `${min}`;
  return `${min.toLocaleString('en')} – ${max.toLocaleString('en')}`;
}
