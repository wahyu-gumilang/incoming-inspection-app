const userService = require('../services/user.service');
const { ok, created } = require('../utils/response');

async function list(req, res) {
  const { rows, meta } = await userService.list(req.validated.query);
  return ok(res, rows, meta);
}

async function lookup(req, res) {
  return ok(res, await userService.lookup(req.validated.query.role));
}

async function get(req, res) {
  return ok(res, await userService.get(req.validated.params.userid));
}

// The temporary password is shown to the admin once, in this response only.
async function create(req, res) {
  const { user, temporaryPassword } = await userService.create(req.validated.body);
  return created(res, { ...user, temporaryPassword });
}

async function update(req, res) {
  return ok(
    res,
    await userService.update(req.user.userid, req.validated.params.userid, req.validated.body),
  );
}

async function resetPassword(req, res) {
  const { user, temporaryPassword } = await userService.resetPassword(
    req.user.userid,
    req.validated.params.userid,
  );
  return ok(res, { ...user, temporaryPassword });
}

module.exports = { list, lookup, get, create, update, resetPassword };
