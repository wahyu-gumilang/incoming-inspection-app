const request = require('supertest');

jest.mock('../config/db', () => ({ query: jest.fn() }));

const app = require('../app');

describe('app', () => {
  it('answers unknown routes with a 404 in the error shape', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  it('answers malformed JSON with a 400', async () => {
    const res = await request(app)
      .post('/api/does-not-exist')
      .set('Content-Type', 'application/json')
      .send('{bad');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
