const request = require('supertest');

jest.mock('../config/db', () => ({ query: jest.fn() }));

const app = require('../app');

describe('app', () => {
  it('answers unknown routes with 404', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
  });
});
