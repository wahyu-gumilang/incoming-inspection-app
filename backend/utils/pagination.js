const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function toSqlPaging({ page, limit }) {
  return { limit, offset: (page - 1) * limit };
}

function buildMeta({ page, limit }, total) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

// Column names can't be bound as placeholders, so the ORDER BY clause is only
// ever built from the caller's whitelist, never from the raw request value.
function resolveSort({ sort, order }, sortable, defaultSort) {
  const column = sort ?? defaultSort;
  if (!sortable.includes(column)) {
    throw new Error(`Sort column "${column}" is not in the whitelist`);
  }
  const direction = order === 'desc' ? 'DESC' : 'ASC';
  return `\`${column}\` ${direction}`;
}

module.exports = { DEFAULT_LIMIT, MAX_LIMIT, toSqlPaging, buildMeta, resolveSort };
