const { ok, created, noContent, fail } = require('../../utils/response');

function mockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.end = jest.fn(() => res);
  return res;
}

describe('response helpers', () => {
  it('ok sends 200 with data and no meta', () => {
    const res = mockRes();
    ok(res, { itemid: '000-228' });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { itemid: '000-228' } });
  });

  it('ok includes meta for lists', () => {
    const res = mockRes();
    const meta = { page: 1, limit: 20, total: 1, totalPages: 1 };
    ok(res, [], meta);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: [], meta });
  });

  it('created sends 201', () => {
    const res = mockRes();
    created(res, { inspectnum: 'INS-000003' });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { inspectnum: 'INS-000003' } });
  });

  it('noContent sends 204 without a body', () => {
    const res = mockRes();
    noContent(res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('fail sends the error shape, with details only when given', () => {
    const res = mockRes();
    fail(res, 404, 'NOT_FOUND', 'Route not found');

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });

    const details = [{ field: 'page', message: 'must be >= 1' }];
    fail(res, 400, 'VALIDATION_ERROR', 'Request validation failed', details);
    expect(res.json).toHaveBeenLastCalledWith({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details },
    });
  });
});
