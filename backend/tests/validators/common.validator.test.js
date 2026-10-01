const { listQuery } = require('../../validators/common.validator');

describe('listQuery', () => {
  const schema = listQuery(['itemid', 'name']);

  it('applies defaults', () => {
    expect(schema.parse({})).toEqual({ page: 1, limit: 20, order: 'asc' });
  });

  it('coerces query strings and trims the search term', () => {
    expect(
      schema.parse({ page: '2', limit: '50', sort: 'name', order: 'desc', q: ' rhino ' }),
    ).toEqual({
      page: 2,
      limit: 50,
      sort: 'name',
      order: 'desc',
      q: 'rhino',
    });
  });

  it('caps limit at 100', () => {
    expect(schema.parse({ limit: '500' }).limit).toBe(100);
  });

  it('treats an empty search as no search', () => {
    expect(schema.parse({ q: '   ' }).q).toBeUndefined();
  });

  it.each([
    [{ page: '0' }],
    [{ page: 'abc' }],
    [{ limit: '0' }],
    [{ sort: 'inspectnum' }],
    [{ order: 'up' }],
  ])('rejects %j', (query) => {
    expect(schema.safeParse(query).success).toBe(false);
  });
});
