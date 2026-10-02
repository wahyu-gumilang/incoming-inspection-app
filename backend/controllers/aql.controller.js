const aqlService = require('../services/aql.service');
const { ok } = require('../utils/response');

async function listPlans(req, res) {
  return ok(res, await aqlService.listPlans());
}

async function getPlan(req, res) {
  return ok(res, await aqlService.getPlan(req.validated.params.planId));
}

async function lookup(req, res) {
  return ok(res, await aqlService.lookup(req.validated.query));
}

async function replaceRows(req, res) {
  const { inspectcategory, rows } = req.validated.body;
  return ok(res, await aqlService.replaceRows(req.validated.params.planId, inspectcategory, rows));
}

async function setDefault(req, res) {
  return ok(res, await aqlService.setDefault(req.validated.params.planId));
}

module.exports = { listPlans, getPlan, lookup, replaceRows, setDefault };
