const { z } = require('zod');
const { listQuery } = require('./common.validator');
const {
  INSPECT_CATEGORY,
  JUDGMENT,
  LINE_STATUS,
  COLUMN_COUNT,
} = require('../constants/inspection');

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date (YYYY-MM-DD)')
  .refine(
    (d) =>
      !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) &&
      new Date(`${d}T00:00:00Z`).toISOString().startsWith(d),
    'must be a real date',
  );
const code = (map, label) =>
  z.coerce.number().refine((v) => Object.values(map).includes(v), `must be one of ${label}`);
const optionalText = (max) =>
  z.string().trim().max(max, `must be at most ${max} characters`).optional();

const inspectionParams = z.object({ inspectnum: z.string().trim().min(1).max(30) });
const deliveryParams = inspectionParams.extend({
  n: z.coerce.number().int().min(1).max(COLUMN_COUNT, `must be 1–${COLUMN_COUNT}`),
});

const listInspectionsQuery = listQuery([
  'inspectnum',
  'inspectdate',
  'itemid',
  'accountnum',
  'inspectstatus',
  'created_at',
]).extend({
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
  item: z.string().trim().max(30).optional(),
  vendor: z.string().trim().max(30).optional(),
  status: z.string().trim().max(30).optional(),
  judgment: code(JUDGMENT, '0 (none), 1 (Accepted), 2 (Rejected), 3 (Concession)').optional(),
});

const createInspectionBody = z.object({
  itemid: z.string().trim().min(1, 'is required').max(30),
  accountnum: z.string().trim().min(1, 'is required').max(30),
  inspectdate: isoDate,
  instrument: optionalText(100),
  qfnum: optionalText(50),
});

const updateInspectionBody = z
  .object({
    accountnum: z.string().trim().min(1).max(30).optional(),
    inspectdate: isoDate.optional(),
    instrument: optionalText(100),
    qfnum: optionalText(50),
  })
  .refine((b) => Object.values(b).some((v) => v !== undefined), { message: 'nothing to update' });

const status = z
  .union([z.literal(LINE_STATUS.OK), z.literal(LINE_STATUS.NG)])
  .nullable()
  .default(null);

// One delivery column, as filled in the delivery modal. Actuals may be numbers or
// numeric text; the service checks the decimals. OK/NG is only taken from the
// client for lines the inspector judges by hand (MANUAL rules, visual, fitting, COA).
const deliveryBody = z.object({
  purchordernum: z.string().trim().min(1, 'is required').max(30),
  deliverydate: isoDate,
  qty_received: z.number().int('must be a whole number of pieces').min(1).max(10_000_000),
  inspectcategory: code(INSPECT_CATEGORY, '0 (100 %), 1 (Normal), 2 (Reduced), 3 (Tightened)'),
  lines: z
    .array(
      z.object({
        linenum: z.number().int().min(1),
        actual: z
          .union([z.number(), z.string().max(20)])
          .nullable()
          .default(null),
        status,
      }),
    )
    .max(200)
    .default([]),
  otherLines: z
    .array(
      z.object({
        linenum: z.number().int().min(1),
        actual_txt: z.string().trim().max(100).nullable().default(null),
        status,
      }),
    )
    .max(200)
    .default([]),
  notgood: z.number().int().min(0),
  judgment: code(JUDGMENT, '0 (none), 1 (Accepted), 2 (Rejected), 3 (Concession)').default(
    JUDGMENT.NONE,
  ),
  concessionnote: z.string().trim().max(255).default(''),
});

module.exports = {
  inspectionParams,
  deliveryParams,
  listInspectionsQuery,
  createInspectionBody,
  updateInspectionBody,
  deliveryBody,
};
