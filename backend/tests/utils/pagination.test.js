const { toSqlPaging, buildMeta, resolveSort } = require('../../utils/pagination');

describe('pagination', () => {
  it('converts page and limit to limit/offset', () => {
    expect(toSqlPaging({ page: 1, limit: 20 })).toEqual({ limit: 20, offset: 0 });
    expect(toSqlPaging({ page: 3, limit: 50 })).toEqual({ limit: 50, offset: 100 });
  });

  it('builds meta and rounds totalPages up', () => {
    expect(buildMeta({ page: 1, limit: 20 }, 134)).toEqual({
      page: 1,
      limit: 20,
      total: 134,
      totalPages: 7,
    });
    expect(buildMeta({ page: 1, limit: 20 }, 0).totalPages).toBe(0);
  });

  describe('resolveSort', () => {
    const sortable = ['itemid', 'name'];

    it('uses the default column ascending when nothing is given', () => {
      expect(resolveSort({}, sortable, 'itemid')).toBe('`itemid` ASC');
    });

    it('uses the requested column and direction', () => {
      expect(resolveSort({ sort: 'name', order: 'desc' }, sortable, 'itemid')).toBe('`name` DESC');
    });

    it('rejects a column outside the whitelist', () => {
      expect(() => resolveSort({ sort: 'name; DROP TABLE x' }, sortable, 'itemid')).toThrow(
        /whitelist/,
      );
    });
  });
});
