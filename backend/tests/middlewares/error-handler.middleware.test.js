const express = require('express');
const request = require('supertest');
const AppError = require('../../utils/app-error');
const errorHandler = require('../../middlewares/error-handler.middleware');

function appThatThrows(err) {
  const app = express();
  app.use(express.json());
  app.all('/boom', async () => {
    throw err;
  });
  app.use(errorHandler);
  return app;
}

describe('error handler', () => {
  let consoleError;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('sends an AppError with its own status, code and details', async () => {
    const details = [{ field: 'itemid', message: 'is required' }];
    const res = await request(
      appThatThrows(new AppError(422, 'BUSINESS_RULE', 'Item does not exist', details)),
    ).get('/boom');

    expect(res.status).toBe(422);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'BUSINESS_RULE', message: 'Item does not exist', details },
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('turns malformed JSON into a 400 VALIDATION_ERROR', async () => {
    const res = await request(appThatThrows(new Error('unreachable')))
      .post('/boom')
      .set('Content-Type', 'application/json')
      .send('{"itemid":');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('turns a MariaDB duplicate key into a 409 DUPLICATE_KEY', async () => {
    const err = Object.assign(new Error("Duplicate entry 'V-001' for key 'PRIMARY'"), {
      code: 'ER_DUP_ENTRY',
    });
    const res = await request(appThatThrows(err)).get('/boom');

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_KEY');
    expect(JSON.stringify(res.body)).not.toContain('Duplicate entry');
  });

  it('hides unexpected errors behind a 500 and logs them', async () => {
    const err = new Error("ER_BAD_FIELD_ERROR: Unknown column 'x' in 'field list'");
    const res = await request(appThatThrows(err)).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
    expect(consoleError).toHaveBeenCalledWith(err);
  });
});
