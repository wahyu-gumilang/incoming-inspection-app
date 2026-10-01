const authService = require('../services/auth.service');
const { ok, noContent } = require('../utils/response');
const { SESSION_COOKIE, SESSION_HOURS } = require('../constants/auth');
const { isProduction } = require('../config/auth');

function cookieOptions() {
  return { httpOnly: true, sameSite: 'strict', secure: isProduction(), path: '/' };
}

async function login(req, res) {
  const { username, password, remember } = req.validated.body;
  const { user, token } = await authService.login(username, password);
  // Without "remember" the cookie ends with the browser session; the token still expires after a shift.
  res.cookie(SESSION_COOKIE, token, {
    ...cookieOptions(),
    ...(remember && { maxAge: SESSION_HOURS * 3600_000 }),
  });
  return ok(res, user);
}

function logout(req, res) {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
  return noContent(res);
}

function me(req, res) {
  return ok(res, req.user);
}

async function updateMe(req, res) {
  return ok(res, await authService.updateProfile(req.user.userid, req.validated.body));
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.validated.body;
  return ok(res, await authService.changePassword(req.user.userid, currentPassword, newPassword));
}

module.exports = { login, logout, me, updateMe, changePassword };
