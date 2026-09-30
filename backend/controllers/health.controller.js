const healthService = require('../services/health.service');
const { ok } = require('../utils/response');

async function getHealth(req, res) {
  return ok(res, await healthService.getHealth());
}

module.exports = { getHealth };
