const request = require('supertest');

jest.mock('../../config/db', () => ({ query: jest.fn() }));

const db = require('../../config/db');
const app = require('../../app');

describe('GET /api/health', () => {
  it('reports a connected database in the standard shape', async () => {
    db.query.mockResolvedValue([[{ 1: 1 }], []]);

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: {
        status: 'ok',
        service: 'incoming-inspection-api',
        db: 'connected',
        timestamp: expect.any(String),
      },
    });
    expect(new Date(res.body.data.timestamp).toISOString()).toBe(res.body.data.timestamp);
  });

  it('still answers 200 when the database is unreachable', async () => {
    db.query.mockRejectedValue(
      Object.assign(new Error('connect ETIMEDOUT'), { code: 'ETIMEDOUT' }),
    );

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.data.db).toBe('disconnected: ETIMEDOUT');
  });

  it('does not leak the error message when there is no error code', async () => {
    db.query.mockRejectedValue(new Error("Access denied for user 'root'@'localhost'"));

    const res = await request(app).get('/api/health');

    expect(res.body.data.db).toBe('disconnected: UNKNOWN');
  });
});
