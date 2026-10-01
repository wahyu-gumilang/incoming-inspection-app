const itemService = require('../services/item.service');
const { ok, created, noContent } = require('../utils/response');

async function list(req, res) {
  const { rows, meta } = await itemService.list(req.validated.query);
  return ok(res, rows, meta);
}

async function lookup(req, res) {
  return ok(res, await itemService.lookup(req.validated.query.q));
}

async function get(req, res) {
  return ok(res, await itemService.get(req.validated.params.itemId));
}

async function create(req, res) {
  return created(res, await itemService.create(req.validated.body));
}

async function rename(req, res) {
  return ok(res, await itemService.rename(req.validated.params.itemId, req.validated.body.name));
}

async function addStandard(req, res) {
  return created(
    res,
    await itemService.addStandard(req.validated.params.itemId, req.validated.body),
  );
}

async function updateStandard(req, res) {
  return ok(res, await itemService.updateStandard(req.validated.params.itemId, req.validated.body));
}

async function deleteStandard(req, res) {
  await itemService.deleteStandard(req.validated.params.itemId, req.validated.query);
  return noContent(res);
}

module.exports = { list, lookup, get, create, rename, addStandard, updateStandard, deleteStandard };
