const db = require('../config/db');
const AppError = require('../utils/app-error');
const vendorRepository = require('../repositories/vendor.repository');
const { toSqlPaging, buildMeta, resolveSort } = require('../utils/pagination');
const { parseCsv } = require('../utils/csv');
const { createVendorBody } = require('../validators/vendor.validator');

const SORTABLE = ['vendaccount', 'name', 'inspectionCount'];
const LOOKUP_LIMIT = 20;
const IMPORT_MAX_ROWS = 2000;

const notFound = (vendaccount) => new AppError(404, 'NOT_FOUND', `Vendor ${vendaccount} not found`);

async function list(query) {
  const { limit, offset } = toSqlPaging(query);
  const orderBy = resolveSort(query, SORTABLE, 'name');
  const [rows, total] = await Promise.all([
    vendorRepository.list({ q: query.q, orderBy, limit, offset }),
    vendorRepository.count({ q: query.q }),
  ]);
  return { rows, meta: buildMeta(query, total) };
}

function lookup(q) {
  return vendorRepository.lookup(q, LOOKUP_LIMIT);
}

async function get(vendaccount) {
  const vendor = await vendorRepository.findById(vendaccount);
  if (!vendor) throw notFound(vendaccount);
  return vendor;
}

async function create(input) {
  try {
    await vendorRepository.insert(input);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'DUPLICATE_KEY', `Vendor ${input.vendaccount} already exists`, [
        { field: 'vendaccount', message: 'is already used' },
      ]);
    }
    throw err;
  }
  return get(input.vendaccount);
}

async function rename(vendaccount, name) {
  if (!(await vendorRepository.rename(vendaccount, name))) throw notFound(vendaccount);
  return get(vendaccount);
}

// A vendor on an inspection can't go: the inspection would lose its supplier.
async function remove(vendaccount) {
  const vendor = await get(vendaccount);
  if (vendor.inspectionCount > 0) {
    throw new AppError(
      409,
      'IN_USE',
      `Vendor ${vendaccount} is used by ${vendor.inspectionCount} inspection(s)`,
    );
  }
  await vendorRepository.remove(vendaccount);
}

// CSV with columns vendaccount, name (header row optional). All rows are checked
// first: one bad row and nothing is saved. Vendors that already exist are skipped.
async function importCsv(text) {
  const rows = parseCsv(text);
  if (rows.length && /^(vendaccount|vendor ?account|account)$/i.test(rows[0][0])) rows.shift();
  if (!rows.length) throw new AppError(400, 'VALIDATION_ERROR', 'The file has no vendor rows');
  if (rows.length > IMPORT_MAX_ROWS) {
    throw new AppError(400, 'VALIDATION_ERROR', `At most ${IMPORT_MAX_ROWS} rows per import`);
  }

  const details = [];
  const vendors = [];
  const seen = new Set();
  rows.forEach((cols, i) => {
    const line = i + 1;
    const parsed = createVendorBody.safeParse({ vendaccount: cols[0] ?? '', name: cols[1] ?? '' });
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) =>
        details.push({ field: `row ${line}.${issue.path.join('.')}`, message: issue.message }),
      );
      return;
    }
    const key = parsed.data.vendaccount.toLowerCase();
    if (seen.has(key)) {
      details.push({
        field: `row ${line}.vendaccount`,
        message: `${parsed.data.vendaccount} appears twice in the file`,
      });
      return;
    }
    seen.add(key);
    vendors.push(parsed.data);
  });
  if (details.length)
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'The file has invalid rows; nothing was imported',
      details,
    );

  const skipped = await vendorRepository.existing(vendors.map((v) => v.vendaccount));
  const skippedKeys = new Set(skipped.map((s) => s.toLowerCase()));
  const fresh = vendors.filter((v) => !skippedKeys.has(v.vendaccount.toLowerCase()));

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    for (const vendor of fresh) await vendorRepository.insert(vendor, conn);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return { created: fresh.length, skipped };
}

module.exports = { list, lookup, get, create, rename, remove, importCsv };
