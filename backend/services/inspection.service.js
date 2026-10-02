// Inspections (PLAN.md §2.4). One inspection = one Form 7.4.3-F1: a part from a
// supplier, its standards copied as lines, and up to 7 delivery columns filled one
// at a time (the delivery modal). Every rule is enforced here; client-sent OK/NG,
// sample sizes and limits are ignored and recomputed.

const db = require('../config/db');
const AppError = require('../utils/app-error');
const inspectionRepository = require('../repositories/inspection.repository');
const itemRepository = require('../repositories/item.repository');
const vendorRepository = require('../repositories/vendor.repository');
const aqlRepository = require('../repositories/aql.repository');
const itemService = require('./item.service');
const { toSqlPaging, buildMeta, resolveSort } = require('../utils/pagination');
const { findPlanRow } = require('./aql');
const j = require('./judgement');
const {
  COLUMN_COUNT,
  COLUMN_NUMBERS,
  INSPECT_TYPE,
  INSPECT_STATUS,
  INSPECT_CATEGORY,
  JUDGMENT,
  LINE_STATUS,
} = require('../constants/inspection');
const { ROLE } = require('../constants/auth');

const SORTABLE = [
  'inspectnum',
  'inspectdate',
  'itemid',
  'accountnum',
  'inspectstatus',
  'created_at',
];

const notFound = (inspectnum) =>
  new AppError(404, 'NOT_FOUND', `Inspection ${inspectnum} not found`);
const toNumber = (h) => (h === null ? null : h / 100);
const isoDateTime = (v) => (v ? String(v).replace(' ', 'T') : null);

async function inTransaction(work) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/* ---------- Delivery columns ---------- */

// A column is "used" when it has a P/O or a quantity; the date alone doesn't count
// (legacy rows default every date to the day they were made).
const isUsed = (h, n) =>
  Boolean((h[`purchordernum${n}`] ?? '').trim()) || Number(h[`qty_received${n}`]) > 0;

function usedCount(header) {
  let n = 0;
  while (n < COLUMN_COUNT && isUsed(header, n + 1)) n += 1;
  return n;
}

// Clearing a column writes these values; unused columns are stored the same way.
function emptyDelivery(n) {
  return {
    [`purchordernum${n}`]: null,
    [`deliverydate${n}`]: null,
    [`qty_received${n}`]: 0,
    [`inspectcategory${n}`]: INSPECT_CATEGORY.FULL,
    [`notgood${n}`]: 0,
    [`judgment${n}`]: JUDGMENT.NONE,
    [`samplesize${n}`]: null,
    [`acceptnum${n}`]: null,
    [`rejectnum${n}`]: null,
    [`concessionnote${n}`]: null,
  };
}

/* ---------- Access ---------- */

// Drafts are edited by their creator or an Admin; anything else (legacy rows,
// submitted inspections) is read-only.
function editProblem(header, user) {
  if (header.inspectstatus !== INSPECT_STATUS.DRAFT) {
    return new AppError(
      409,
      'INVALID_STATUS',
      `Inspection ${header.inspectnum} is not a draft and can't be changed`,
    );
  }
  if (user.role !== ROLE.ADMIN && header.inspectbyid !== user.userid) {
    return new AppError(
      403,
      'FORBIDDEN',
      'Only the inspector who created this draft, or an Admin, can change it',
    );
  }
  return null;
}

/* ---------- Shapes sent to the client ---------- */

function toLine(row) {
  return { ...row, mode: j.ruleMode(j.ruleFromLine(row)) };
}

function deliveries(header, lines, otherLines) {
  const used = usedCount(header);
  const statusRows = [...lines, ...otherLines].map((l) =>
    COLUMN_NUMBERS.map((n) => l[`status_${n}`]),
  );
  const ngCells = j.countNgCells(statusRows, COLUMN_COUNT);
  return COLUMN_NUMBERS.map((n) => {
    const plan =
      header[`samplesize${n}`] === null
        ? null
        : {
            samplesize: header[`samplesize${n}`],
            acceptnum: header[`acceptnum${n}`],
            rejectnum: header[`rejectnum${n}`],
          };
    return {
      n,
      used: n <= used,
      ngCells: ngCells[n - 1],
      suggestedJudgment: n <= used && plan ? j.suggestJudgment(header[`notgood${n}`], plan) : null,
    };
  });
}

function toDetail(header, lines, otherLines, user) {
  const used = usedCount(header);
  return {
    ...header,
    created_at: isoDateTime(header.created_at),
    updated_at: isoDateTime(header.updated_at),
    deliveryCount: used,
    totalReceived: COLUMN_NUMBERS.slice(0, used).reduce(
      (sum, n) => sum + Number(header[`qty_received${n}`]),
      0,
    ),
    editable: !editProblem(header, user),
    deliveries: deliveries(header, lines, otherLines),
    lines: lines.map(toLine),
    otherLines,
  };
}

function toListRow(row) {
  const used = usedCount(row);
  const cols = COLUMN_NUMBERS.slice(0, used);
  return {
    inspectnum: row.inspectnum,
    inspectdate: row.inspectdate,
    itemid: row.itemid,
    itemname: row.itemname,
    accountnum: row.accountnum,
    name: row.name,
    inspectstatus: row.inspectstatus,
    inspectby: row.inspectby,
    created_at: isoDateTime(row.created_at),
    deliveryCount: used,
    ngPieces: cols.reduce((sum, n) => sum + Number(row[`notgood${n}`] || 0), 0),
    judgments: cols.map((n) => row[`judgment${n}`]),
  };
}

/* ---------- Reads ---------- */

async function list(query) {
  const filter = {
    q: query.q,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    item: query.item,
    vendor: query.vendor,
    status: query.status,
    judgment: query.judgment,
  };
  const { limit, offset } = toSqlPaging(query);
  // Newest first unless the caller sorts.
  const orderBy = query.sort ? resolveSort(query, SORTABLE, 'inspectnum') : '`inspectnum` DESC';
  const [rows, total] = await Promise.all([
    inspectionRepository.list(filter, { orderBy, limit, offset }),
    inspectionRepository.count(filter),
  ]);
  return { rows: rows.map(toListRow), meta: buildMeta(query, total) };
}

async function get(inspectnum, user, conn = db) {
  const header = await inspectionRepository.findHeader(inspectnum, conn);
  if (!header) throw notFound(inspectnum);
  const [lines, otherLines] = await Promise.all([
    inspectionRepository.findLines(inspectnum, conn),
    inspectionRepository.findOtherLines(inspectnum, conn),
  ]);
  return toDetail(header, lines, otherLines, user);
}

/* ---------- Create / header ---------- */

async function vendorOrFail(accountnum) {
  const vendor = await vendorRepository.findById(accountnum);
  if (!vendor)
    throw new AppError(422, 'BUSINESS_RULE', `Vendor ${accountnum} does not exist`, [
      { field: 'accountnum', message: 'is unknown' },
    ]);
  return vendor;
}

// The item's standards, copied: later edits to the master never touch this inspection.
function snapshotLines(inspectnum, standards) {
  const std = standards.filter((s) => s.inspecttype === INSPECT_TYPE.STD);
  const other = standards.filter((s) => s.inspecttype !== INSPECT_TYPE.STD);
  return {
    lines: std.map((s, i) => ({
      inspectnum,
      linenum: i + 1,
      inspecttype: s.inspecttype,
      inspectitem: s.inspectitem,
      standard_txt: s.standard_txt,
      standard: s.standard,
      // The legacy single tolerance column can only hold a symmetric tolerance.
      tolerance: Number(s.tolerance_plus) === Number(s.tolerance_minus) ? s.tolerance_plus : null,
      tolerance_txt: s.tolerance,
      tolerance_plus: s.tolerance_plus,
      tolerance_minus: s.tolerance_minus,
    })),
    otherLines: other.map((s, i) => ({
      inspectnum,
      linenum: i + 1,
      inspecttype: s.inspecttype,
      inspectitem: s.inspectitem,
      standard_txt: s.standard_txt || s.tolerance || null,
    })),
  };
}

async function create(input, user) {
  if (!(await itemRepository.findById(input.itemid))) {
    throw new AppError(422, 'BUSINESS_RULE', `Item ${input.itemid} does not exist`, [
      { field: 'itemid', message: 'is unknown' },
    ]);
  }
  const item = await itemService.get(input.itemid);
  if (!item.inspectItems.length) {
    throw new AppError(
      422,
      'BUSINESS_RULE',
      `Item ${item.itemid} has no QC standards to inspect against`,
      [{ field: 'itemid', message: 'has no standards' }],
    );
  }
  const vendor = await vendorOrFail(input.accountnum);
  const plan = await aqlRepository.findDefaultPlan();
  if (!plan) throw new AppError(422, 'BUSINESS_RULE', 'No default AQL plan is set');

  const inspectnum = await inTransaction(async (conn) => {
    const number = await inspectionRepository.takeNextNumber(conn);
    await inspectionRepository.insertHeader(
      {
        inspectnum: number,
        inspectdate: input.inspectdate,
        itemid: item.itemid,
        itemname: item.name,
        accountnum: vendor.vendaccount,
        name: vendor.name,
        inspectstatus: INSPECT_STATUS.DRAFT,
        instrument: input.instrument || null,
        qfnum: input.qfnum || null,
        aqlplanid: plan.planid,
        inspectby: user.fullname,
        inspectbyid: user.userid,
      },
      conn,
    );
    const { lines, otherLines } = snapshotLines(number, item.inspectItems);
    await inspectionRepository.insertLines('inspectline', lines, conn);
    await inspectionRepository.insertLines('inspectlineother', otherLines, conn);
    return number;
  });
  return get(inspectnum, user);
}

// Supplier, date, instrument and QF no. The part can't change: the lines are its standards.
async function updateHeader(inspectnum, input, user) {
  return inTransaction(async (conn) => {
    const header = await inspectionRepository.findHeader(inspectnum, conn, { forUpdate: true });
    if (!header) throw notFound(inspectnum);
    const problem = editProblem(header, user);
    if (problem) throw problem;

    const fields = {};
    if (input.accountnum !== undefined && input.accountnum !== header.accountnum) {
      const vendor = await vendorOrFail(input.accountnum);
      fields.accountnum = vendor.vendaccount;
      fields.name = vendor.name;
    }
    if (input.inspectdate !== undefined) fields.inspectdate = input.inspectdate;
    if (input.instrument !== undefined) fields.instrument = input.instrument || null;
    if (input.qfnum !== undefined) fields.qfnum = input.qfnum || null;
    if (Object.keys(fields).length)
      await inspectionRepository.updateHeader(inspectnum, fields, conn);
    return get(inspectnum, user, conn);
  });
}

async function remove(inspectnum, user) {
  await inTransaction(async (conn) => {
    const header = await inspectionRepository.findHeader(inspectnum, conn, { forUpdate: true });
    if (!header) throw notFound(inspectnum);
    const problem = editProblem(header, user);
    if (problem) throw problem;
    await inspectionRepository.remove(inspectnum, conn);
  });
}

/* ---------- Delivery columns (the delivery modal) ---------- */

function measuredStdColumn(lines, input, n) {
  const byLine = new Map(input.map((l, i) => [l.linenum, { ...l, i }]));
  const details = [];
  for (const l of input) {
    if (!lines.some((line) => line.linenum === l.linenum)) {
      details.push({
        field: `lines.${byLine.get(l.linenum).i}.linenum`,
        message: `${l.linenum} is not a dimension line of this inspection`,
      });
    }
  }
  const updates = lines.map((line) => {
    const sent = byLine.get(line.linenum);
    const raw = sent ? sent.actual : null;
    const hundredths = j.toHundredths(raw);
    if (hundredths === undefined) {
      details.push({
        field: `lines.${sent.i}.actual`,
        message: 'must be a number with at most 2 decimals',
      });
      return null;
    }
    const [status] = j.judgeLine(j.ruleFromLine(line), [raw], [sent ? sent.status : null]);
    return {
      linenum: line.linenum,
      fields: { [`actual_${n}`]: toNumber(hundredths), [`status_${n}`]: status },
    };
  });
  return { updates, details };
}

function otherColumn(otherLines, input, n) {
  const byLine = new Map(input.map((l, i) => [l.linenum, { ...l, i }]));
  const details = [];
  for (const l of input) {
    if (!otherLines.some((line) => line.linenum === l.linenum)) {
      details.push({
        field: `otherLines.${byLine.get(l.linenum).i}.linenum`,
        message: `${l.linenum} is not a visual/fitting/certificate line of this inspection`,
      });
    }
  }
  const updates = otherLines.map((line) => {
    const sent = byLine.get(line.linenum) || {};
    return {
      linenum: line.linenum,
      fields: {
        [`actual_txt_${n}`]: sent.actual_txt ?? null,
        [`status_${n}`]: sent.status ?? null,
      },
    };
  });
  return { updates, details };
}

async function saveDelivery(inspectnum, n, input, user) {
  return inTransaction(async (conn) => {
    const header = await inspectionRepository.findHeader(inspectnum, conn, { forUpdate: true });
    if (!header) throw notFound(inspectnum);
    const problem = editProblem(header, user);
    if (problem) throw problem;

    const used = usedCount(header);
    if (n > used + 1) {
      throw new AppError(
        422,
        'BUSINESS_RULE',
        `Fill delivery ${used + 1} first: deliveries are filled in order`,
        [{ field: 'n', message: `must be at most ${used + 1}` }],
      );
    }

    const [lines, otherLines] = await Promise.all([
      inspectionRepository.findLines(inspectnum, conn),
      inspectionRepository.findOtherLines(inspectnum, conn),
    ]);
    const std = measuredStdColumn(lines, input.lines, n);
    const other = otherColumn(otherLines, input.otherLines, n);
    if (std.details.length || other.details.length) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', [
        ...std.details,
        ...other.details,
      ]);
    }

    // The AQL row comes from this inspection's plan, never from the client.
    const planRows = await aqlRepository.rows(header.aqlplanid, conn);
    const plan = findPlanRow(planRows, input.qty_received, input.inspectcategory);
    if (!plan) {
      throw new AppError(
        422,
        'BUSINESS_RULE',
        "The inspection's AQL plan has no rows for this category",
        [{ field: 'inspectcategory', message: 'is not covered by the AQL plan' }],
      );
    }

    const statuses = [
      ...std.updates.map((u) => u.fields[`status_${n}`]),
      ...other.updates.map((u) => u.fields[`status_${n}`]),
    ];
    const ngCells = statuses.filter((s) => s === LINE_STATUS.NG).length;
    const details = [];
    if (input.notgood > plan.samplesize) {
      details.push({
        field: 'notgood',
        message: `can't exceed the sample size (${plan.samplesize})`,
      });
    }
    details.push(
      ...j.judgmentProblems({
        judgment: input.judgment,
        defects: input.notgood,
        ngCells,
        plan,
        note: input.concessionnote,
      }),
    );
    if (details.length)
      throw new AppError(422, 'BUSINESS_RULE', 'The delivery breaks a judgment rule', details);

    await inspectionRepository.updateHeader(
      inspectnum,
      {
        [`purchordernum${n}`]: input.purchordernum,
        [`deliverydate${n}`]: input.deliverydate,
        [`qty_received${n}`]: input.qty_received,
        [`inspectcategory${n}`]: input.inspectcategory,
        [`notgood${n}`]: input.notgood,
        [`judgment${n}`]: input.judgment,
        [`samplesize${n}`]: plan.samplesize,
        [`acceptnum${n}`]: plan.acceptnum,
        [`rejectnum${n}`]: plan.rejectnum,
        [`concessionnote${n}`]:
          input.judgment === JUDGMENT.CONCESSION ? input.concessionnote.trim() : null,
      },
      conn,
    );
    for (const u of std.updates)
      await inspectionRepository.updateLineColumn(
        'inspectline',
        inspectnum,
        u.linenum,
        u.fields,
        conn,
      );
    for (const u of other.updates)
      await inspectionRepository.updateLineColumn(
        'inspectlineother',
        inspectnum,
        u.linenum,
        u.fields,
        conn,
      );
    return get(inspectnum, user, conn);
  });
}

// Only the last used column can go, so delivery numbers never get a hole.
async function removeDelivery(inspectnum, n, user) {
  return inTransaction(async (conn) => {
    const header = await inspectionRepository.findHeader(inspectnum, conn, { forUpdate: true });
    if (!header) throw notFound(inspectnum);
    const problem = editProblem(header, user);
    if (problem) throw problem;
    const used = usedCount(header);
    if (n !== used) {
      throw new AppError(
        422,
        'BUSINESS_RULE',
        used ? `Only the last delivery (${used}) can be removed` : 'There is no delivery to remove',
        [{ field: 'n', message: used ? `must be ${used}` : 'no delivery' }],
      );
    }
    await inspectionRepository.updateHeader(inspectnum, emptyDelivery(n), conn);
    const [lines, otherLines] = await Promise.all([
      inspectionRepository.findLines(inspectnum, conn),
      inspectionRepository.findOtherLines(inspectnum, conn),
    ]);
    for (const l of lines) {
      await inspectionRepository.updateLineColumn(
        'inspectline',
        inspectnum,
        l.linenum,
        { [`actual_${n}`]: null, [`status_${n}`]: null },
        conn,
      );
    }
    for (const l of otherLines) {
      await inspectionRepository.updateLineColumn(
        'inspectlineother',
        inspectnum,
        l.linenum,
        { [`actual_txt_${n}`]: null, [`status_${n}`]: null },
        conn,
      );
    }
    return get(inspectnum, user, conn);
  });
}

module.exports = {
  list,
  get,
  create,
  updateHeader,
  remove,
  saveDelivery,
  removeDelivery,
  usedCount,
};
