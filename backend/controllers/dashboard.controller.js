const dashboardService = require('../services/dashboard.service');
const { ok } = require('../utils/response');

async function stats(req, res) {
  return ok(res, await dashboardService.stats(req.user, req.validated.query.period));
}

module.exports = { stats };
