const vendorService = require('../services/vendor.service');
const { ok, created, noContent } = require('../utils/response');

async function list(req, res) {
  const { rows, meta } = await vendorService.list(req.validated.query);
  return ok(res, rows, meta);
}

async function lookup(req, res) {
  return ok(res, await vendorService.lookup(req.validated.query.q));
}

async function get(req, res) {
  return ok(res, await vendorService.get(req.validated.params.vendaccount));
}

async function create(req, res) {
  return created(res, await vendorService.create(req.validated.body));
}

async function rename(req, res) {
  return ok(
    res,
    await vendorService.rename(req.validated.params.vendaccount, req.validated.body.name),
  );
}

async function remove(req, res) {
  await vendorService.remove(req.validated.params.vendaccount);
  return noContent(res);
}

async function importCsv(req, res) {
  return ok(res, await vendorService.importCsv(typeof req.body === 'string' ? req.body : ''));
}

module.exports = { list, lookup, get, create, rename, remove, importCsv };
