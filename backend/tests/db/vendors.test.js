const db = require('../../config/db');
const { app, request, signIn } = require('./helpers');

let admin;
let inspector;

beforeAll(async () => {
  admin = await signIn('070203');
  inspector = await signIn('10187');
});
afterAll(() => db.close());

const csv = (text) =>
  request(app)
    .post('/api/vendors/import')
    .set('Cookie', admin)
    .set('Content-Type', 'text/csv')
    .send(text);

describe('reading vendors (any signed-in user)', () => {
  it('needs a login', async () => {
    await request(app).get('/api/vendors').expect(401);
  });

  it('lists vendors with how many inspections use them', async () => {
    const res = await request(app)
      .get('/api/vendors?q=V-000&sort=vendaccount&limit=3')
      .set('Cookie', inspector);

    expect(res.status).toBe(200);
    // inspections.test creates inspections for V-0001, so only the shape is fixed here;
    // the exact count is checked on V-T1 below, which no other file uses.
    expect(res.body.data[0]).toEqual({
      vendaccount: 'V-0001',
      name: 'PT Sinar Logam Abadi',
      inspectionCount: expect.any(Number),
    });
    expect(res.body.meta.limit).toBe(3);
  });

  it('looks vendors up by account or name', async () => {
    const res = await request(app).get('/api/vendors/lookup?q=baja').set('Cookie', inspector);
    expect(res.body.data).toEqual([{ vendaccount: 'V-0003', name: 'PT Baja Prima Nusantara' }]);
  });

  it('answers 404 for an unknown vendor', async () => {
    await request(app).get('/api/vendors/V-9999').set('Cookie', inspector).expect(404);
  });
});

describe('changing vendors (Admin only)', () => {
  it('refuses an inspector', async () => {
    await request(app)
      .post('/api/vendors')
      .set('Cookie', inspector)
      .send({ vendaccount: 'V-T1', name: 'X' })
      .expect(403);
    await request(app)
      .post('/api/vendors/import')
      .set('Cookie', inspector)
      .set('Content-Type', 'text/csv')
      .send('V-T1,X')
      .expect(403);
  });

  it('creates, renames and refuses duplicates or bad input', async () => {
    const res = await request(app)
      .post('/api/vendors')
      .set('Cookie', admin)
      .send({ vendaccount: 'V-T1', name: 'PT Uji Coba' });
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({ vendaccount: 'V-T1', name: 'PT Uji Coba', inspectionCount: 0 });

    await request(app)
      .post('/api/vendors')
      .set('Cookie', admin)
      .send({ vendaccount: 'V-0001', name: 'X' })
      .expect(409);
    await request(app)
      .post('/api/vendors')
      .set('Cookie', admin)
      .send({ vendaccount: '', name: '' })
      .expect(400);
    const renamed = await request(app)
      .put('/api/vendors/V-T1')
      .set('Cookie', admin)
      .send({ name: 'PT Uji Coba Baru' });
    expect(renamed.body.data.name).toBe('PT Uji Coba Baru');
  });

  it('deletes an unused vendor but not one an inspection uses', async () => {
    await request(app)
      .post('/api/vendors')
      .set('Cookie', admin)
      .send({ vendaccount: 'V-T2', name: 'PT Dipakai' })
      .expect(201);
    await db.query("INSERT INTO inspecttable (inspectnum, accountnum) VALUES ('INS-VT2', 'V-T2')");
    try {
      const res = await request(app).delete('/api/vendors/V-T2').set('Cookie', admin);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('IN_USE');
    } finally {
      await db.query("DELETE FROM inspecttable WHERE inspectnum = 'INS-VT2'");
    }
    await request(app).delete('/api/vendors/V-T2').set('Cookie', admin).expect(204);
    await request(app).delete('/api/vendors/V-T2').set('Cookie', admin).expect(404);
  });
});

describe('POST /api/vendors/import', () => {
  it('imports new vendors and skips existing ones (Excel ; format with header)', async () => {
    const res = await csv(
      '﻿vendaccount;name\r\nV-I1;"PT Impor; Satu"\r\nV-0001;PT Sinar Logam Abadi\r\nV-I2;CV Impor Dua\r\n',
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ created: 2, skipped: ['V-0001'] });
    const one = await request(app).get('/api/vendors/V-I1').set('Cookie', admin);
    expect(one.body.data.name).toBe('PT Impor; Satu');
  });

  it('imports nothing when any row is invalid, and says which rows', async () => {
    const res = await csv('V-I3,PT Baik\nbad/id,PT Salah\nV-I4,\nV-I3,PT Lagi\n');

    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field)).toEqual([
      'row 2.vendaccount',
      'row 3.name',
      'row 4.vendaccount',
    ]);
    await request(app).get('/api/vendors/V-I3').set('Cookie', admin).expect(404);
  });

  it('refuses an empty file', async () => {
    await csv('vendaccount,name\n').expect(400);
  });
});
