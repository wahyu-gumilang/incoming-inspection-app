const db = require('../../config/db');
const { app, request, signIn } = require('./helpers');

let admin;
let inspector;

beforeAll(async () => {
  admin = await signIn('070203');
  inspector = await signIn('10187');
});
afterAll(() => db.close());

const get = (url, cookie = inspector) => request(app).get(url).set('Cookie', cookie);

describe('reading items (any signed-in user)', () => {
  it('needs a login', async () => {
    await request(app).get('/api/items').expect(401);
  });

  it('lists items with standard counts and warnings', async () => {
    const res = await get('/api/items?q=rhino');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      {
        itemid: '000-228',
        name: 'Handle Rhino Prima',
        standardCounts: { STD: 3, CERTIFIKAT: 0, VISUAL: 3, FITTING: 1 },
        warningCount: 0,
      },
    ]);
    expect(res.body.meta).toMatchObject({ page: 1, total: 1 });
  });

  it('counts doubtful standards (Pasir Galunggung: printed 0.1, stored 10)', async () => {
    const res = await get('/api/items?q=1-1-14-03');
    expect(res.body.data[0].warningCount).toBe(1);
  });

  it('pages and sorts on whitelisted columns only', async () => {
    const res = await get('/api/items?limit=2&sort=name&order=desc');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.limit).toBe(2);
    await get('/api/items?sort=inspectqty').expect(400);
  });

  it('looks items up by part no or name', async () => {
    const res = await get('/api/items/lookup?q=000');
    expect(res.body.data).toEqual([{ itemid: '000-228', name: 'Handle Rhino Prima' }]);
    await get('/api/items/lookup').expect(400);
  });

  it('returns an item with its standards in form order, trimmed, with mode and warnings', async () => {
    const res = await get('/api/items/000-228');

    expect(res.status).toBe(200);
    const items = res.body.data.inspectItems;
    expect(items.map((s) => `${s.inspecttype}:${s.inspectitem}`)).toEqual([
      'STD:A',
      'STD:B',
      'STD:D',
      'VISUAL:Black',
      'VISUAL:Cat Rata/Tidak Belang',
      'VISUAL:Tidak Gores',
      'FITTING:C',
    ]);
    expect(items[1]).toMatchObject({
      standard_txt: 'Ø16',
      standard: 16,
      tolerance: '+0.3/-0',
      tolerance_plus: 0.3,
      tolerance_minus: 0,
      mode: 'RANGE',
      warnings: [],
    });
  });

  it('marks Min rules and puts the certificate after the dimensions', async () => {
    const items = (await get('/api/items/1-1-14-39')).body.data.inspectItems;
    expect(items.map((s) => s.inspecttype)).toEqual(['STD', 'STD', 'STD', 'CERTIFIKAT']);
    expect(items.find((s) => s.inspectitem === 'Tensile Strength').mode).toBe('MIN');
  });

  it('answers 404 for an unknown item', async () => {
    await get('/api/items/NOPE-1').expect(404);
  });
});

describe('changing items (Admin only)', () => {
  const post = (url, body, cookie = admin) =>
    request(app).post(url).set('Cookie', cookie).send(body);
  const put = (url, body, cookie = admin) => request(app).put(url).set('Cookie', cookie).send(body);

  it('refuses an inspector', async () => {
    const res = await post('/api/items', { itemid: 'T-INSP', name: 'X' }, inspector);
    expect(res.status).toBe(403);
  });

  it('creates an item, refuses a duplicate and a bad id', async () => {
    const res = await post('/api/items', { itemid: 'T-ITEM 1', name: 'Test Bracket' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      itemid: 'T-ITEM 1',
      name: 'Test Bracket',
      inspectItems: [],
    });

    expect((await post('/api/items', { itemid: 'T-ITEM 1', name: 'Again' })).status).toBe(409);
    expect((await post('/api/items', { itemid: 'bad/id', name: 'X' })).status).toBe(400);
  });

  it('filters items without standards', async () => {
    const res = await get('/api/items?hasStandards=false&q=T-ITEM');
    expect(res.body.data.map((i) => i.itemid)).toEqual(['T-ITEM 1']);
  });

  it('adds, updates and deletes standards', async () => {
    const url = `/api/items/${encodeURIComponent('T-ITEM 1')}/inspect-items`;
    const added = await post(url, {
      inspecttype: 'STD',
      inspectitem: 'A',
      standard_txt: 'Ø12',
      standard: 12,
      tolerance: '±0.2',
      tolerance_plus: 0.2,
      tolerance_minus: 0.2,
    });
    expect(added.status).toBe(201);
    expect(added.body.data.inspectItems).toHaveLength(1);

    const updated = await put(url, {
      inspecttype: 'STD',
      inspectitem: 'A',
      standard_txt: 'Ø12',
      standard: 12,
      tolerance: '+0.3/-0',
      tolerance_plus: 0.3,
      tolerance_minus: 0,
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data.inspectItems[0]).toMatchObject({
      tolerance: '+0.3/-0',
      tolerance_plus: 0.3,
      tolerance_minus: 0,
    });

    const del = await request(app)
      .delete(`${url}?inspecttype=STD&inspectitem=A`)
      .set('Cookie', admin);
    expect(del.status).toBe(204);
    await request(app)
      .delete(`${url}?inspecttype=STD&inspectitem=A`)
      .set('Cookie', admin)
      .expect(404);
    await put(url, { inspecttype: 'STD', inspectitem: 'A', standard: 1 }).expect(404);
  });

  it('refuses a duplicate standard, even against a stored trailing space', async () => {
    // 000-228 has 'FITTING ' / 'C' stored with a trailing space.
    const res = await post('/api/items/000-228/inspect-items', {
      inspecttype: 'FITTING',
      inspectitem: 'C',
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_KEY');
  });

  it('validates standards', async () => {
    const url = `/api/items/${encodeURIComponent('T-ITEM 1')}/inspect-items`;
    const res = await post(url, {
      inspecttype: 'STD',
      inspectitem: 'B',
      standard: null,
      tolerance_plus: 0.125,
      tolerance_minus: -1,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual([
      'standard',
      'tolerance_minus',
      'tolerance_plus',
    ]);
    await post(url, { inspecttype: 'ROUGHNESS', inspectitem: 'B' }).expect(400);
  });

  it('renames an item and the name copied into its standards', async () => {
    await post(`/api/items/${encodeURIComponent('T-ITEM 1')}/inspect-items`, {
      inspecttype: 'VISUAL',
      inspectitem: 'Tidak Karat',
    }).expect(201);
    const res = await put(`/api/items/${encodeURIComponent('T-ITEM 1')}`, {
      name: 'Test Bracket Rev B',
    });

    expect(res.body.data.name).toBe('Test Bracket Rev B');
    const [rows] = await db.query(
      "SELECT DISTINCT itemname FROM inventinspectitem WHERE itemid = 'T-ITEM 1'",
    );
    expect(rows).toEqual([{ itemname: 'Test Bracket Rev B' }]);
  });
});
