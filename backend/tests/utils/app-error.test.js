const AppError = require('../../utils/app-error');

describe('AppError', () => {
  it('carries status, code, message and details', () => {
    const details = [{ field: 'itemid', message: 'is required' }];
    const err = new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', details);

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('AppError');
    expect(err.status).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Request validation failed');
    expect(err.details).toEqual(details);
  });

  it('leaves details undefined when not given', () => {
    expect(new AppError(404, 'NOT_FOUND', 'Item not found').details).toBeUndefined();
  });
});
