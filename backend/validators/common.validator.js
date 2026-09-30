const { z } = require('zod');
const { DEFAULT_LIMIT, MAX_LIMIT } = require('../utils/pagination');

// Shared ?page=&limit=&sort=&order=&q= schema. Resources extend it with their
// own filters and pass the columns that may be sorted on.
function listQuery(sortable) {
  return z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .default(DEFAULT_LIMIT)
      .transform((n) => Math.min(n, MAX_LIMIT)),
    sort: z.enum(sortable).optional(),
    order: z.enum(['asc', 'desc']).default('asc'),
    q: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((v) => v || undefined),
  });
}

module.exports = { listQuery };
