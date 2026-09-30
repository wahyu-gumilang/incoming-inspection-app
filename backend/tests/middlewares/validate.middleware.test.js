const express = require('express');
const request = require('supertest');
const { z } = require('zod');
const validate = require('../../middlewares/validate.middleware');
const errorHandler = require('../../middlewares/error-handler.middleware');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.post(
    '/items/:itemId',
    validate({
      params: z.object({ itemId: z.string().min(1) }),
      query: z.object({ dryRun: z.coerce.boolean().default(false) }),
      body: z.object({ standard: z.number(), tolerance_plus: z.number().min(0) }),
    }),
    (req, res) => res.json(req.validated),
  );
  app.use(errorHandler);
  return app;
}

describe('validate middleware', () => {
  it('passes parsed params, query and body on req.validated', async () => {
    const res = await request(buildApp())
      .post('/items/000-228?dryRun=1')
      .send({ standard: 12.5, tolerance_plus: 0.4, extra: 'dropped' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      params: { itemId: '000-228' },
      query: { dryRun: true },
      body: { standard: 12.5, tolerance_plus: 0.4 },
    });
  });

  it('returns 400 with one detail per invalid field', async () => {
    const res = await request(buildApp()).post('/items/000-228').send({ tolerance_plus: -1 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual([
      'standard',
      'tolerance_plus',
    ]);
  });

  it('validates a missing body as an empty object', async () => {
    const res = await request(buildApp()).post('/items/000-228');

    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual([
      'standard',
      'tolerance_plus',
    ]);
  });
});
