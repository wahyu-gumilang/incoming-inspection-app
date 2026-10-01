const AppError = require('../utils/app-error');
const { allowedOrigins } = require('../config/auth');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// CSRF guard next to the SameSite=Strict cookie: a browser always sends Origin on
// cross-site writes, so a foreign Origin is refused. Requests without Origin
// (curl, server-to-server) carry no browser cookie and pass through.
function checkOrigin(req, res, next) {
  const origin = req.get('origin');
  if (SAFE_METHODS.has(req.method) || !origin || allowedOrigins().includes(origin)) return next();
  throw new AppError(403, 'FORBIDDEN', 'Request origin is not allowed');
}

module.exports = checkOrigin;
