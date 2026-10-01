const AppError = require('../utils/app-error');
const authService = require('../services/auth.service');
const { SESSION_COOKIE } = require('../constants/auth');

// Puts the signed-in user on req.user, or answers 401.
async function requireAuth(req, res, next) {
  const user = await authService.userFromToken(req.cookies?.[SESSION_COOKIE]);
  if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in');
  req.user = user;
  next();
}

// A user on a temporary password may only reach /api/auth until they change it.
function requirePasswordChanged(req, res, next) {
  if (req.user.must_change_password) {
    throw new AppError(403, 'PASSWORD_CHANGE_REQUIRED', 'Change your temporary password first');
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'FORBIDDEN', "Your role isn't allowed to do this");
    }
    next();
  };
}

module.exports = { requireAuth, requirePasswordChanged, requireRole };
