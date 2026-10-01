const { z } = require('zod');
const { listQuery } = require('./common.validator');

const vendaccount = z
  .string()
  .trim()
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9._\- ]{0,29}$/,
    'must be 1–30 letters, digits, spaces, dots or dashes',
  );
const name = z.string().trim().min(1, 'is required').max(100, 'must be at most 100 characters');

const vendorParams = z.object({ vendaccount: z.string().trim().min(1).max(30) });
const listVendorsQuery = listQuery(['vendaccount', 'name', 'inspectionCount']);
const lookupQuery = z.object({ q: z.string().trim().min(1, 'is required').max(50) });
const createVendorBody = z.object({ vendaccount, name });
const renameVendorBody = z.object({ name });

module.exports = {
  vendaccount,
  name,
  vendorParams,
  listVendorsQuery,
  lookupQuery,
  createVendorBody,
  renameVendorBody,
};
