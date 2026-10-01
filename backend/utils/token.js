const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');
const { SESSION_HOURS } = require('../constants/auth');

// The token only identifies the user; role and active flag are read from the
// database on every request, so a role change or deactivation applies at once.
function signSession(userid) {
  return jwt.sign({ sub: String(userid) }, jwtSecret(), {
    expiresIn: `${SESSION_HOURS}h`,
    algorithm: 'HS256',
  });
}

// Returns the user id, or null when the token is missing, expired or tampered with.
function verifySession(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, jwtSecret(), { algorithms: ['HS256'] });
    const id = Number(payload.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

module.exports = { signSession, verifySession };
