const inspectionService = require('../services/inspection.service');
const { ok, created, noContent } = require('../utils/response');

async function list(req, res) {
  const { rows, meta } = await inspectionService.list(req.validated.query);
  return ok(res, rows, meta);
}

async function get(req, res) {
  return ok(res, await inspectionService.get(req.validated.params.inspectnum, req.user));
}

async function create(req, res) {
  return created(res, await inspectionService.create(req.validated.body, req.user));
}

async function update(req, res) {
  return ok(
    res,
    await inspectionService.updateHeader(
      req.validated.params.inspectnum,
      req.validated.body,
      req.user,
    ),
  );
}

async function remove(req, res) {
  await inspectionService.remove(req.validated.params.inspectnum, req.user);
  return noContent(res);
}

async function saveDelivery(req, res) {
  const { inspectnum, n } = req.validated.params;
  return ok(res, await inspectionService.saveDelivery(inspectnum, n, req.validated.body, req.user));
}

async function removeDelivery(req, res) {
  const { inspectnum, n } = req.validated.params;
  return ok(res, await inspectionService.removeDelivery(inspectnum, n, req.user));
}

module.exports = { list, get, create, update, remove, saveDelivery, removeDelivery };
