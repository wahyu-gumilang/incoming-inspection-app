const db = require('../config/db');
const AppError = require('../utils/app-error');
const itemRepository = require('../repositories/item.repository');
const { toSqlPaging, buildMeta, resolveSort } = require('../utils/pagination');
const { ruleFromStandard, ruleMode } = require('./judgement');
const { standardWarnings } = require('./standard-check');
const { INSPECT_TYPE_ORDER, normalizeInspectType } = require('../constants/inspection');

const SORTABLE = ['itemid', 'name'];
const LOOKUP_LIMIT = 20;

const itemNotFound = (itemid) => new AppError(404, 'NOT_FOUND', `Item ${itemid} not found`);
const trimText = (v) => (typeof v === 'string' ? v.trim() : v);

// The API shows trimmed keys and texts; the stored values keep their spaces.
function toInspectItem(row) {
  return {
    inspecttype: normalizeInspectType(row.inspecttype),
    inspectitem: trimText(row.inspectitem),
    standard_txt: trimText(row.standard_txt),
    standard: row.standard,
    tolerance: trimText(row.tolerance),
    tolerance_plus: row.tolerance_plus,
    tolerance_minus: row.tolerance_minus,
    mode: ruleMode(ruleFromStandard(row)),
    warnings: standardWarnings(row),
  };
}

// Form order: dimensions, certificate, visual, fitting; then item names naturally (A, B, … J, K).
function byFormOrder(a, b) {
  const t = INSPECT_TYPE_ORDER.indexOf(a.inspecttype) - INSPECT_TYPE_ORDER.indexOf(b.inspecttype);
  return (
    t || a.inspectitem.localeCompare(b.inspectitem, 'en', { numeric: true, sensitivity: 'base' })
  );
}

function summarize(rows) {
  const standardCounts = Object.fromEntries(INSPECT_TYPE_ORDER.map((t) => [t, 0]));
  let warningCount = 0;
  for (const row of rows) {
    standardCounts[normalizeInspectType(row.inspecttype)] += 1;
    if (standardWarnings(row).length) warningCount += 1;
  }
  return { standardCounts, warningCount };
}

async function list(query) {
  const filter = { q: query.q, hasStandards: query.hasStandards };
  const { limit, offset } = toSqlPaging(query);
  const orderBy = resolveSort(query, SORTABLE, 'itemid');
  const [items, total] = await Promise.all([
    itemRepository.list({ ...filter, orderBy, limit, offset }),
    itemRepository.count(filter),
  ]);
  const standards = await itemRepository.standardsFor(items.map((i) => i.itemid));
  const rows = items.map((item) => ({
    itemid: item.itemid.trim(),
    name: trimText(item.name),
    ...summarize(standards.filter((s) => s.itemid === item.itemid)),
  }));
  return { rows, meta: buildMeta(query, total) };
}

async function lookup(q) {
  const rows = await itemRepository.lookup(q, LOOKUP_LIMIT);
  return rows.map((r) => ({ itemid: r.itemid.trim(), name: trimText(r.name) }));
}

async function get(itemid) {
  const item = await itemRepository.findById(itemid);
  if (!item) throw itemNotFound(itemid);
  const standards = await itemRepository.standardsFor([itemid]);
  const inspectItems = standards.map(toInspectItem).sort(byFormOrder);
  return {
    itemid: item.itemid.trim(),
    name: trimText(item.name),
    ...summarize(standards),
    inspectItems,
  };
}

async function create(input) {
  try {
    await itemRepository.insert(input);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'DUPLICATE_KEY', `Item ${input.itemid} already exists`, [
        { field: 'itemid', message: 'is already used' },
      ]);
    }
    throw err;
  }
  return get(input.itemid);
}

// The item name is also copied into every standard row, so both change together.
async function rename(itemid, name) {
  if (!(await itemRepository.findById(itemid))) throw itemNotFound(itemid);
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await itemRepository.rename(itemid, name, conn);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return get(itemid);
}

// Edits apply to new inspections only: saved inspections keep their own snapshot.
async function addStandard(itemid, standard) {
  const item = await itemRepository.findById(itemid);
  if (!item) throw itemNotFound(itemid);
  try {
    await itemRepository.insertStandard(item.name, { ...standard, itemid });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError(
        409,
        'DUPLICATE_KEY',
        `${standard.inspecttype} standard "${standard.inspectitem}" already exists for ${itemid}`,
        [{ field: 'inspectitem', message: 'is already used for this type' }],
      );
    }
    throw err;
  }
  return get(itemid);
}

async function updateStandard(itemid, standard) {
  if (!(await itemRepository.findById(itemid))) throw itemNotFound(itemid);
  if (!(await itemRepository.updateStandard({ ...standard, itemid }))) {
    throw new AppError(
      404,
      'NOT_FOUND',
      `${standard.inspecttype} standard "${standard.inspectitem}" not found for ${itemid}`,
    );
  }
  return get(itemid);
}

async function deleteStandard(itemid, { inspecttype, inspectitem }) {
  if (!(await itemRepository.deleteStandard(itemid, inspecttype, inspectitem))) {
    throw new AppError(
      404,
      'NOT_FOUND',
      `${inspecttype} standard "${inspectitem}" not found for ${itemid}`,
    );
  }
}

module.exports = { list, lookup, get, create, rename, addStandard, updateStandard, deleteStandard };
