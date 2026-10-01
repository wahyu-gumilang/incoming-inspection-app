const AppError = require('../utils/app-error');
const userRepository = require('../repositories/user.repository');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signSession, verifySession } = require('../utils/token');
const { createLoginLimiter } = require('./login-limiter');

const limiter = createLoginLimiter();

// Compared against when the username doesn't exist, so a wrong username takes
// as long as a wrong password and response times don't reveal which accounts exist.
const DUMMY_HASH = '$2b$12$kqw5W0VJgGs9dPHZzQNHO.Hc8aP5pJjiM/dwe01lKgCiSPooP8UBW';

const badCredentials = () =>
  new AppError(401, 'UNAUTHENTICATED', 'Username or password is incorrect');

async function login(username, password) {
  const wait = limiter.retryAfter(username);
  if (wait > 0) {
    throw new AppError(
      429,
      'TOO_MANY_REQUESTS',
      'Too many failed sign-in attempts. Try again later.',
      [{ field: 'retryAfterSeconds', message: String(wait) }],
    );
  }

  const found = await userRepository.findAuthByUsername(username);
  const valid = await verifyPassword(password, found ? found.passwordHash : DUMMY_HASH);
  if (!found || !valid) {
    limiter.fail(username);
    throw badCredentials();
  }
  limiter.reset(username);

  // Only told after the right password, so it doesn't help guessing usernames.
  if (!found.user.active) {
    throw new AppError(403, 'FORBIDDEN', 'This account is deactivated. Ask a QC administrator.');
  }

  await userRepository.touchLogin(found.user.userid);
  const user = await userRepository.findById(found.user.userid);
  return { user, token: signSession(user.userid) };
}

// Used by requireAuth on every request: the token names the user, the database
// decides whether they still exist, are active and what role they have now.
async function userFromToken(token) {
  const userid = verifySession(token);
  if (!userid) return null;
  const user = await userRepository.findById(userid);
  return user && user.active ? user : null;
}

async function updateProfile(userid, { fullname, email, theme }) {
  await userRepository.update(userid, { fullname, email: email === '' ? null : email, theme });
  return userRepository.findById(userid);
}

async function changePassword(userid, currentPassword, newPassword) {
  const hash = await userRepository.findPasswordHash(userid);
  if (!hash || !(await verifyPassword(currentPassword, hash))) {
    throw new AppError(422, 'BUSINESS_RULE', 'Current password is incorrect', [
      { field: 'currentPassword', message: 'is incorrect' },
    ]);
  }
  if (currentPassword === newPassword) {
    throw new AppError(422, 'BUSINESS_RULE', 'The new password must be different', [
      { field: 'newPassword', message: 'must differ from the current password' },
    ]);
  }
  await userRepository.setPassword(userid, await hashPassword(newPassword), false);
  return userRepository.findById(userid);
}

module.exports = { login, userFromToken, updateProfile, changePassword, limiter };
