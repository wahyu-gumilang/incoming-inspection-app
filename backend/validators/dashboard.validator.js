const { z } = require('zod');

const dashboardQuery = z.object({
  period: z.enum(['month', '90d', 'quarter', 'year']).optional(),
});

module.exports = { dashboardQuery };
