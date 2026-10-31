const db = require('../../config/db');
const { app, request, signIn } = require('./helpers');

// One admin and one inspector, mirroring the other db test files.
let admin;
let inspector;

beforeAll(async () => {
  admin = await signIn('070203');
  inspector = await signIn('10187');
});
afterAll(() => db.close());

describe('GET /api/inspections/stats', () => {
  it('answers with kpis, chart, bySupplier, recent, waiting and drafts', async () => {
    const res = await request(app)
      .get('/api/inspections/stats')
      .set('Cookie', admin);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kpis).toMatchObject({
      inspections: expect.any(Number),
      ngRate: expect.any(Number),
      waiting: expect.any(Number),
      waitingOld: expect.any(Number),
      acceptedRate: expect.any(Number),
    });
    expect(Array.isArray(res.body.data.chart)).toBe(true);
    expect(Array.isArray(res.body.data.bySupplier)).toBe(true);
    expect(Array.isArray(res.body.data.recent)).toBe(true);
    expect(Array.isArray(res.body.data.waiting)).toBe(true);
    expect(Array.isArray(res.body.data.drafts)).toBe(true);
  });

  it('returns the waiting list to an Admin but an empty list to an Inspector', async () => {
    const asAdmin = await request(app).get('/api/inspections/stats').set('Cookie', admin);
    const asInspector = await request(app).get('/api/inspections/stats').set('Cookie', inspector);

    expect(asAdmin.status).toBe(200);
    expect(asInspector.status).toBe(200);
    // Inspector doesn't check; the card is hidden, so the list stays empty.
    expect(asInspector.body.data.waiting).toEqual([]);
  });

  it('rejects an unknown period', async () => {
    const res = await request(app)
      .get('/api/inspections/stats?period=week')
      .set('Cookie', admin);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
