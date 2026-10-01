const { z } = require('zod');
const { listQuery } = require('./common.validator');
const { toHundredths } = require('../services/judgement');
const { INSPECT_TYPE, INSPECT_TYPE_ORDER } = require('../constants/inspection');

// decimal(18,2) / decimal(19,2): at most two decimals.
const decimal = z
  .number()
  .refine((v) => toHundredths(v) !== undefined, 'must have at most 2 decimals');
const text = (max) => z.string().trim().max(max, `must be at most ${max} characters`);
const boolParam = z
  .enum(['true', 'false'])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === 'true'));

const itemParams = z.object({ itemId: z.string().trim().min(1).max(30) });

const listItemsQuery = listQuery(['itemid', 'name']).extend({ hasStandards: boolParam });

const lookupQuery = z.object({ q: z.string().trim().min(1, 'is required').max(50) });

const createItemBody = z.object({
  itemid: z
    .string()
    .trim()
    // Existing ids use letters, digits, '-', '.' and spaces (e.g. '28 74 003'); no '/', which would break URLs.
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9._\- ]{0,29}$/,
      'must be 1–30 letters, digits, spaces, dots or dashes',
    ),
  name: text(100).min(1, 'is required'),
});

const renameItemBody = z.object({ name: text(100).min(1, 'is required') });

// A standard is identified by its type and item name inside one part.
const standardKey = {
  inspecttype: z.enum(INSPECT_TYPE_ORDER),
  inspectitem: text(100).min(1, 'is required'),
};

const standardBody = z
  .object({
    ...standardKey,
    standard_txt: text(100).default(''),
    standard: decimal.nullable().default(0),
    tolerance: text(50).default(''),
    tolerance_plus: decimal.min(0, "can't be negative").default(0),
    tolerance_minus: decimal.min(0, "can't be negative").default(0),
  })
  .refine((s) => s.inspecttype !== INSPECT_TYPE.STD || s.standard !== null, {
    path: ['standard'],
    message: 'is required for a dimension (STD)',
  });

const standardKeyQuery = z.object(standardKey);

module.exports = {
  itemParams,
  listItemsQuery,
  lookupQuery,
  createItemBody,
  renameItemBody,
  standardBody,
  standardKeyQuery,
};
