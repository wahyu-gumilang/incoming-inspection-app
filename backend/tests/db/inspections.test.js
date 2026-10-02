const db = require('../../config/db');
const { app, request, signIn } = require('./helpers');
const {
  INSPECT_CATEGORY: CAT,
  JUDGMENT: J,
  LINE_STATUS: S,
} = require('../../constants/inspection');

let budi; // inspector, creates the drafts
let siti; // checker, not the creator
let admin;

beforeAll(async () => {
  budi = await signIn('10187');
  siti = await signIn('10234');
  admin = await signIn('070203');
});
afterAll(() => db.close());

const create = (body, cookie = budi) =>
  request(app).post('/api/inspections').set('Cookie', cookie).send(body);
const getOne = (num, cookie = budi) =>
  request(app).get(`/api/inspections/${num}`).set('Cookie', cookie);
const delivery = (num, n, body, cookie = budi) =>
  request(app).put(`/api/inspections/${num}/deliveries/${n}`).set('Cookie', cookie).send(body);

const NEW = {
  itemid: '000-228',
  accountnum: 'V-0001',
  inspectdate: '2026-10-01',
  instrument: 'Digital caliper',
};

// 000-228: lines 1..3 = A (12.5 ±0.4), B (Ø16 +0.3/-0), D (28.0 ±0.4); other lines 1..4 = 3 visual + 1 fitting.
const allOk = (actuals) => ({
  lines: actuals.map((actual, i) => ({ linenum: i + 1, actual })),
  otherLines: [1, 2, 3, 4].map((linenum) => ({ linenum, status: S.OK })),
});
const firstDelivery = {
  purchordernum: '33932',
  deliverydate: '2026-09-15',
  qty_received: 50,
  inspectcategory: CAT.NORMAL,
  ...allOk(['12.62', '16.12', '27.88']),
  notgood: 0,
  judgment: J.ACCEPTED,
};
const ngDelivery = {
  purchordernum: '34071',
  deliverydate: '2026-09-24',
  qty_received: 20,
  inspectcategory: CAT.NORMAL,
  ...allOk(['12.48', '16.35', '28.05']),
};

describe('POST /api/inspections', () => {
  it('creates a draft with a number, the signed-in inspector and a copy of the standards', async () => {
    const res = await create(NEW);

    expect(res.status).toBe(201);
    const d = res.body.data;
    expect(d.inspectnum).toMatch(/^INS-\d{6}$/);
    expect(d).toMatchObject({
      itemid: '000-228',
      itemname: 'Handle Rhino Prima',
      accountnum: 'V-0001',
      name: 'PT Sinar Logam Abadi',
      inspectstatus: 'DRAFT',
      inspectby: 'Budi Santoso',
      aqlplanid: 1,
      instrument: 'Digital caliper',
      deliveryCount: 0,
      editable: true,
      deliverydate1: null,
      purchordernum1: null,
    });
    expect(d.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(d.lines.map((l) => `${l.linenum}:${l.inspectitem}:${l.mode}`)).toEqual([
      '1:A:RANGE',
      '2:B:RANGE',
      '3:D:RANGE',
    ]);
    expect(d.lines[1]).toMatchObject({
      standard_txt: 'Ø16',
      standard: 16,
      tolerance_txt: '+0.3/-0',
      tolerance_plus: 0.3,
      tolerance_minus: 0,
      tolerance: null,
    });
    expect(d.otherLines.map((l) => `${l.inspecttype}:${l.inspectitem}`)).toEqual([
      'VISUAL:Black',
      'VISUAL:Cat Rata/Tidak Belang',
      'VISUAL:Tidak Gores',
      'FITTING:C',
    ]);
    expect(d.deliveries).toHaveLength(7);
  });

  it('never gives two inspections the same number, even when saved at the same moment', async () => {
    const results = await Promise.all(Array.from({ length: 6 }, () => create(NEW)));
    const numbers = results.map((r) => r.body.data.inspectnum);

    expect(results.every((r) => r.status === 201)).toBe(true);
    expect(new Set(numbers).size).toBe(6);
  });

  it('refuses an unknown item or vendor, or an item without standards', async () => {
    expect((await create({ ...NEW, itemid: 'NOPE' })).body.error.details).toEqual([
      { field: 'itemid', message: 'is unknown' },
    ]);
    expect((await create({ ...NEW, accountnum: 'V-NOPE' })).status).toBe(422);
    await db.query(
      "INSERT IGNORE INTO inventtable (itemid, name, inspectqty) VALUES ('T-BARE', 'No standards', 0)",
    );
    const bare = await create({ ...NEW, itemid: 'T-BARE' });
    expect(bare.status).toBe(422);
    expect(bare.body.error.message).toMatch(/no QC standards/);
  });

  it('validates the body', async () => {
    const res = await create({ itemid: '', accountnum: 'V-0001', inspectdate: '2026-02-30' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((x) => x.field).sort()).toEqual(['inspectdate', 'itemid']);
  });

  it('needs a login', async () => {
    await request(app).post('/api/inspections').send(NEW).expect(401);
  });
});

describe('delivery columns (the delivery modal)', () => {
  let num;

  beforeAll(async () => {
    num = (await create(NEW)).body.data.inspectnum;
  });

  it('saves delivery 1, judges the values and snapshots the AQL row', async () => {
    const res = await delivery(num, 1, firstDelivery);

    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d).toMatchObject({
      purchordernum1: '33932',
      deliverydate1: '2026-09-15',
      qty_received1: 50,
      inspectcategory1: CAT.NORMAL,
      samplesize1: 2,
      acceptnum1: 0,
      rejectnum1: 1,
      notgood1: 0,
      judgment1: J.ACCEPTED,
      deliveryCount: 1,
      totalReceived: 50,
    });
    expect(d.lines.map((l) => [l.actual_1, l.status_1])).toEqual([
      [12.62, S.OK],
      [16.12, S.OK],
      [27.88, S.OK],
    ]);
    expect(d.otherLines.every((l) => l.status_1 === S.OK)).toBe(true);
    expect(d.deliveries[0]).toEqual({
      n: 1,
      used: true,
      ngCells: 0,
      suggestedJudgment: J.ACCEPTED,
    });
  });

  it('ignores an OK sent for an out-of-tolerance value', async () => {
    const body = {
      ...ngDelivery,
      lines: ngDelivery.lines.map((l) => ({ ...l, status: S.OK })),
      notgood: 1,
      judgment: J.REJECTED,
    };
    const res = await delivery(num, 2, body);

    expect(res.status).toBe(200);
    expect(res.body.data.lines[1]).toMatchObject({ actual_2: 16.35, status_2: S.NG });
    expect(res.body.data.deliveries[1]).toMatchObject({
      ngCells: 1,
      suggestedJudgment: J.REJECTED,
    });
  });

  it.each([
    ['0 defective pieces while a value is NG', { notgood: 0, judgment: J.REJECTED }, 'notgood'],
    ['Accepted above Ac', { notgood: 1, judgment: J.ACCEPTED }, 'judgment'],
    ['Concession without a note', { notgood: 1, judgment: J.CONCESSION }, 'concessionnote'],
    ['more defective pieces than the sample', { notgood: 3, judgment: J.REJECTED }, 'notgood'],
  ])('refuses %s', async (_, extra, field) => {
    const res = await delivery(num, 2, { ...ngDelivery, ...extra });
    expect(res.status).toBe(422);
    expect(res.body.error.details.map((x) => x.field)).toContain(field);
  });

  it('accepts a Concession with a note and keeps the note', async () => {
    const res = await delivery(num, 2, {
      ...ngDelivery,
      notgood: 1,
      judgment: J.CONCESSION,
      concessionnote: ' Burr on B, accepted by PPIC ',
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      judgment2: J.CONCESSION,
      concessionnote2: 'Burr on B, accepted by PPIC',
      samplesize2: 2,
    });
  });

  it('uses the AQL table: lot 600 tightened → 8 pcs; lot 1 → 100 %', async () => {
    const t = await delivery(num, 3, {
      ...firstDelivery,
      purchordernum: '34561',
      qty_received: 600,
      inspectcategory: CAT.TIGHTENING,
    });
    expect(t.body.data).toMatchObject({ samplesize3: 8, acceptnum3: 0, rejectnum3: 1 });
    const one = await delivery(num, 3, {
      ...firstDelivery,
      purchordernum: '34561',
      qty_received: 1,
    });
    expect(one.body.data).toMatchObject({ samplesize3: 1, acceptnum3: 0, rejectnum3: 1 });
  });

  it('fills deliveries in order', async () => {
    const res = await delivery(num, 5, firstDelivery);
    expect(res.status).toBe(422);
    expect(res.body.error.message).toMatch(/Fill delivery 4 first/);
  });

  it('refuses bad measurements and lines that are not on the inspection', async () => {
    const bad = await delivery(num, 4, {
      ...firstDelivery,
      lines: [
        { linenum: 1, actual: '12.625' },
        { linenum: 9, actual: '1' },
      ],
    });
    expect(bad.status).toBe(400);
    expect(bad.body.error.details.map((x) => x.field).sort()).toEqual([
      'lines.0.actual',
      'lines.1.linenum',
    ]);
  });

  it('removes only the last delivery', async () => {
    expect(
      (await request(app).delete(`/api/inspections/${num}/deliveries/1`).set('Cookie', budi))
        .status,
    ).toBe(422);
    const res = await request(app)
      .delete(`/api/inspections/${num}/deliveries/3`)
      .set('Cookie', budi);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      deliveryCount: 2,
      purchordernum3: null,
      deliverydate3: null,
      qty_received3: 0,
      samplesize3: null,
    });
    expect(res.body.data.lines.every((l) => l.actual_3 === null && l.status_3 === null)).toBe(true);
  });
});

describe('who can change what', () => {
  let num;

  beforeAll(async () => {
    num = (await create(NEW)).body.data.inspectnum;
  });

  it('lets others read a draft but not change it, except an Admin', async () => {
    const seen = await getOne(num, siti);
    expect(seen.status).toBe(200);
    expect(seen.body.data.editable).toBe(false);

    const blocked = await delivery(num, 1, firstDelivery, siti);
    expect(blocked.status).toBe(403);
    await delivery(num, 1, firstDelivery, admin).expect(200);
  });

  it('keeps legacy inspections read-only', async () => {
    await db.query(
      "INSERT IGNORE INTO inspecttable (inspectnum, itemid, accountnum, inspectstatus) VALUES ('INS-LEGACY', '000-228', 'V-0001', '1')",
    );
    const res = await delivery('INS-LEGACY', 1, firstDelivery, admin);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INVALID_STATUS');
    expect((await getOne('INS-LEGACY', admin)).body.data.editable).toBe(false);
  });

  it('edits the header and copies the new supplier name', async () => {
    const res = await request(app)
      .put(`/api/inspections/${num}`)
      .set('Cookie', budi)
      .send({ accountnum: 'V-0003', instrument: 'Micrometer' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      accountnum: 'V-0003',
      name: 'PT Baja Prima Nusantara',
      instrument: 'Micrometer',
      itemid: '000-228',
    });
    await request(app)
      .put(`/api/inspections/${num}`)
      .set('Cookie', budi)
      .send({ accountnum: 'V-NOPE' })
      .expect(422);
  });

  it('deletes a draft', async () => {
    await request(app).delete(`/api/inspections/${num}`).set('Cookie', siti).expect(403);
    await request(app).delete(`/api/inspections/${num}`).set('Cookie', budi).expect(204);
    await getOne(num).expect(404);
    const [[left]] = await db.query('SELECT COUNT(*) AS n FROM inspectline WHERE inspectnum = ?', [
      num,
    ]);
    expect(left.n).toBe(0);
  });
});

describe('snapshot and manual rules', () => {
  beforeAll(async () => {
    await db.query(
      "INSERT IGNORE INTO inventtable (itemid, name, inspectqty) VALUES ('T-SNAP', 'Snapshot part', 0)",
    );
    await db.query(`INSERT IGNORE INTO inventinspectitem (itemid, itemname, inspecttype, inspectitem, standard_txt, standard, tolerance, tolerance_plus, tolerance_minus) VALUES
      ('T-SNAP', 'Snapshot part', 'STD', 'A', '10', 10, '±0.5', 0.5, 0.5),
      ('T-SNAP', 'Snapshot part', 'STD', 'No Coil', 'No Coil', 0, ' 0.0', 0, 0)`);
  });

  it('keeps the copied standard when the master changes later', async () => {
    const num = (await create({ ...NEW, itemid: 'T-SNAP' })).body.data.inspectnum;
    await db.query(
      "UPDATE inventinspectitem SET standard = 99, tolerance_plus = 9 WHERE itemid = 'T-SNAP' AND inspectitem = 'A'",
    );

    const line = (await getOne(num)).body.data.lines.find((l) => l.inspectitem === 'A');
    expect(line).toMatchObject({ standard: 10, tolerance_plus: 0.5 });
  });

  it("takes the inspector's OK/NG for a rule without limits", async () => {
    const created = (await create({ ...NEW, itemid: 'T-SNAP' })).body.data;
    const manual = created.lines.find((l) => l.inspectitem === 'No Coil');
    expect(manual.mode).toBe('MANUAL');

    const res = await delivery(created.inspectnum, 1, {
      ...firstDelivery,
      otherLines: [],
      lines: [
        { linenum: 1, actual: '10.2' },
        { linenum: manual.linenum, actual: null, status: S.NG },
      ],
      notgood: 1,
      judgment: J.REJECTED,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.lines.find((l) => l.inspectitem === 'No Coil').status_1).toBe(S.NG);
  });
});

describe('GET /api/inspections', () => {
  let num;

  beforeAll(async () => {
    num = (await create({ ...NEW, accountnum: 'V-0002', inspectdate: '2026-08-15' })).body.data
      .inspectnum;
    await delivery(num, 1, {
      ...ngDelivery,
      purchordernum: 'PO-FIND-ME',
      notgood: 1,
      judgment: J.CONCESSION,
      concessionnote: 'ok by PPIC',
    }).expect(200);
  });

  it('lists newest first with delivery summaries', async () => {
    const res = await request(app).get('/api/inspections?limit=3').set('Cookie', siti);
    expect(res.status).toBe(200);
    const nums = res.body.data.map((r) => r.inspectnum);
    expect([...nums].sort().reverse()).toEqual(nums);
    expect(res.body.meta.limit).toBe(3);
  });

  it.each([
    ['q (P/O)', 'q=PO-FIND'],
    ['vendor + date range', 'vendor=V-0002&dateFrom=2026-08-01&dateTo=2026-08-31'],
    ['judgment', 'judgment=3&vendor=V-0002'],
  ])('filters by %s', async (_, q) => {
    const res = await request(app).get(`/api/inspections?${q}`).set('Cookie', siti);
    expect(res.body.data.map((r) => r.inspectnum)).toContain(num);
    const row = res.body.data.find((r) => r.inspectnum === num);
    expect(row).toMatchObject({
      deliveryCount: 1,
      ngPieces: 1,
      judgments: [J.CONCESSION],
      name: 'CV Maju Teknik Mandiri',
    });
  });

  it('refuses an unknown sort column', async () => {
    await request(app).get('/api/inspections?sort=inspectby').set('Cookie', siti).expect(400);
  });
});
