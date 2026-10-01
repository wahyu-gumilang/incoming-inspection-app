const db = require('../../config/db');
const { app, request, signIn } = require('./helpers');

let admin;
let inspector;

beforeAll(async () => {
  admin = await signIn('070203');
  inspector = await signIn('10187');
});
afterAll(() => db.close());

const lookup = (q) => request(app).get(`/api/aql/lookup?${q}`).set('Cookie', inspector);

describe('GET /api/aql/lookup', () => {
  it.each([
    [
      'lot=100&category=1',
      {
        planid: 1,
        lot: 100,
        inspectcategory: 1,
        codeletter: 'B',
        samplesize: 3,
        acceptnum: 0,
        rejectnum: 1,
        fullInspection: false,
      },
    ],
    [
      'lot=600&category=3',
      {
        planid: 1,
        lot: 600,
        inspectcategory: 3,
        codeletter: 'D',
        samplesize: 8,
        acceptnum: 0,
        rejectnum: 1,
        fullInspection: false,
      },
    ],
    [
      'lot=7&category=0',
      {
        planid: 1,
        lot: 7,
        inspectcategory: 0,
        codeletter: '-',
        samplesize: 7,
        acceptnum: 0,
        rejectnum: 1,
        fullInspection: true,
      },
    ],
    [
      'lot=90&category=1&planId=2',
      {
        planid: 2,
        lot: 90,
        inspectcategory: 1,
        codeletter: 'F',
        samplesize: 20,
        acceptnum: 1,
        rejectnum: 2,
        fullInspection: false,
      },
    ],
  ])('%s', async (q, expected) => {
    const res = await lookup(q);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(expected);
  });

  it('validates lot and category', async () => {
    const res = await lookup('lot=0&category=9');
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual(['category', 'lot']);
  });

  it('answers 404 for an unknown plan', async () => {
    await lookup('lot=10&category=1&planId=99').expect(404);
  });

  it('needs a login', async () => {
    await request(app).get('/api/aql/lookup?lot=10&category=1').expect(401);
  });
});

describe('plans', () => {
  it('lists both plans with the categories they cover', async () => {
    const res = await request(app).get('/api/aql/plans').set('Cookie', inspector);

    expect(res.body.data.map((p) => [p.planid, p.inspectlevel, p.isdefault])).toEqual([
      [1, 'S-1', true],
      [2, 'II', false],
    ]);
    expect(res.body.data[0].categories.sort()).toEqual([1, 2, 3]);
  });

  it('returns a plan with its rows', async () => {
    const res = await request(app).get('/api/aql/plans/1').set('Cookie', inspector);
    expect(res.body.data.rows).toHaveLength(12);
    expect(res.body.data.rows[0]).toEqual({
      inspectcategory: 1,
      lotmin: 2,
      lotmax: 50,
      codeletter: 'A',
      samplesize: 2,
      acceptnum: 0,
      rejectnum: 1,
    });
  });
});

describe('editing plans (Admin only)', () => {
  const tightened = {
    inspectcategory: 3,
    rows: [
      { lotmin: 2, lotmax: 50, codeletter: 'D', samplesize: 8, acceptnum: 0, rejectnum: 1 },
      { lotmin: 51, lotmax: null, codeletter: 'F', samplesize: 20, acceptnum: 0, rejectnum: 1 },
    ],
  };

  it('refuses an inspector', async () => {
    await request(app)
      .put('/api/aql/plans/2/rows')
      .set('Cookie', inspector)
      .send(tightened)
      .expect(403);
    await request(app).put('/api/aql/plans/2/default').set('Cookie', inspector).expect(403);
  });

  it('replaces one category of rows and the lookup follows', async () => {
    await lookup('lot=100&category=3&planId=2').expect(422);
    const res = await request(app)
      .put('/api/aql/plans/2/rows')
      .set('Cookie', admin)
      .send(tightened);

    expect(res.status).toBe(200);
    expect(res.body.data.rows.filter((r) => r.inspectcategory === 3)).toHaveLength(2);
    expect((await lookup('lot=100&category=3&planId=2')).body.data).toMatchObject({
      samplesize: 20,
      codeletter: 'F',
    });
    expect(res.body.data.rows.filter((r) => r.inspectcategory === 1)).toHaveLength(9);
  });

  it('refuses inconsistent rows and keeps the stored ones', async () => {
    const res = await request(app)
      .put('/api/aql/plans/2/rows')
      .set('Cookie', admin)
      .send({
        inspectcategory: 1,
        rows: [
          { lotmin: 2, lotmax: 50, codeletter: 'C', samplesize: 5, acceptnum: 0, rejectnum: 1 },
          { lotmin: 70, lotmax: null, codeletter: 'F', samplesize: 20, acceptnum: 1, rejectnum: 2 },
        ],
      });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toEqual([
      { field: 'rows.1.lotmin', message: 'leaves lots 51–69 without a row' },
    ]);
    expect(
      (await request(app).get('/api/aql/plans/2').set('Cookie', admin)).body.data.rows.filter(
        (r) => r.inspectcategory === 1,
      ),
    ).toHaveLength(9);
  });

  it('switches the default plan', async () => {
    const res = await request(app).put('/api/aql/plans/2/default').set('Cookie', admin);
    try {
      expect(res.body.data.isdefault).toBe(true);
      expect((await lookup('lot=90&category=1')).body.data).toMatchObject({
        planid: 2,
        samplesize: 20,
      });
    } finally {
      await request(app).put('/api/aql/plans/1/default').set('Cookie', admin).expect(200);
    }
    const plans = (await request(app).get('/api/aql/plans').set('Cookie', admin)).body.data;
    expect(plans.filter((p) => p.isdefault).map((p) => p.planid)).toEqual([1]);
  });
});
