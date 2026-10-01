const { z } = require('zod');
const { INSPECT_CATEGORY } = require('../constants/inspection');

const count = (min) =>
  z.coerce.number().int(`must be a whole number`).min(min, `must be at least ${min}`);
const SAMPLED = [INSPECT_CATEGORY.NORMAL, INSPECT_CATEGORY.REDUCE, INSPECT_CATEGORY.TIGHTENING];

const planParams = z.object({ planId: count(1) });

const lookupQuery = z.object({
  lot: count(1).max(10_000_000, 'is too large'),
  category: z.coerce
    .number()
    .refine(
      (c) => Object.values(INSPECT_CATEGORY).includes(c),
      'must be 0 (100 %), 1 (Normal), 2 (Reduced) or 3 (Tightened)',
    ),
  planId: count(1).optional(),
});

const row = z.object({
  lotmin: count(1),
  lotmax: count(1).nullable(),
  codeletter: z.string().trim().min(1).max(2),
  samplesize: count(1),
  acceptnum: count(0),
  rejectnum: count(1),
});

const replaceRowsBody = z.object({
  inspectcategory: z
    .number()
    .refine((c) => SAMPLED.includes(c), 'must be 1 (Normal), 2 (Reduced) or 3 (Tightened)'),
  rows: z.array(row).min(1, 'needs at least one row').max(30),
});

module.exports = { planParams, lookupQuery, replaceRowsBody };
