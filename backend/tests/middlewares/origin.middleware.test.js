const express = require('express');
const request = require('supertest');
const checkOrigin = require('../../middlewares/origin.middleware');
const errorHandler = require('../../middlewares/error-handler.middleware');

function buildApp() {
  const app = express();
  app.use(checkOrigin);
  app.all('/x', (req, res) => res.status(204).end());
  app.use(errorHandler);
  return app;
}

describe('origin check', () => {
  beforeAll(() => {
    process.env.ALLOWED_ORIGINS = 'http://localhost:4200';
  });

  it('lets writes from an allowed origin through', async () => {
    await request(buildApp()).post('/x').set('Origin', 'http://localhost:4200').expect(204);
  });

  it('lets requests without Origin through (no browser, no cookie)', async () => {
    await request(buildApp()).post('/x').expect(204);
  });

  it('lets reads from any origin through', async () => {
    await request(buildApp()).get('/x').set('Origin', 'https://evil.example').expect(204);
  });

  it('refuses writes from a foreign origin', async () => {
    const res = await request(buildApp()).post('/x').set('Origin', 'https://evil.example');

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
