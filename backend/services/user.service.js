const AppError = require('../utils/app-error');
const userRepository = require('../repositories/user.repository');
const { hashPassword, temporaryPassword } = require('../utils/password');
const { toSqlPaging, buildMeta, resolveSort } = require('../utils/pagination');
const { ROLE, CHECK_ROLES } = require('../constants/auth');

const SORTABLE = ['username', 'fullname', 'role', 'last_login_at', 'created_at'];

const notFound = () => new AppError(404, 'NOT_FOUND', 'User not found');

async function list(query) {
  const filter = { q: query.q, role: query.role, active: query.active };
  const { limit, offset } = toSqlPaging(query);
  const orderBy = resolveSort(query, SORTABLE, 'fullname');
  const [rows, total] = await Promise.all([
    userRepository.list({ ...filter, orderBy, limit, offset }),
    userRepository.count(filter),
  ]);
  return { rows, meta: buildMeta(query, total) };
}

async function get(userid) {
  const user = await userRepository.findById(userid);
  if (!user) throw notFound();
  return user;
}

// "Who can check?" includes admins, who can do everything a checker can.
function lookup(role) {
  return userRepository.lookup(role === ROLE.CHECKER ? CHECK_ROLES : [role]);
}

async function insertUser({ username, fullname, email, role }, password, mustChange) {
  try {
    const userid = await userRepository.insert({
      username,
      fullname,
      email: email || null,
      role,
      password_hash: await hashPassword(password),
      must_change_password: mustChange,
    });
    return userRepository.findById(userid);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'DUPLICATE_KEY', `Username "${username}" already exists`, [
        { field: 'username', message: 'is already taken' },
      ]);
    }
    throw err;
  }
}

// Admin creates an account; the user signs in with the temporary password and must change it.
async function create(input) {
  const password = temporaryPassword();
  const user = await insertUser(input, password, true);
  return { user, temporaryPassword: password };
}

// Used by `npm run user:create-admin`: the person types their own password.
function createWithPassword(input, password) {
  return insertUser(input, password, false);
}

async function update(actorId, userid, changes) {
  const user = await get(userid);
  if (userid === actorId) {
    if (changes.role !== undefined && changes.role !== user.role) {
      throw new AppError(422, 'BUSINESS_RULE', "You can't change your own role", [
        { field: 'role', message: 'is your own' },
      ]);
    }
    if (changes.active === false) {
      throw new AppError(422, 'BUSINESS_RULE', "You can't deactivate yourself", [
        { field: 'active', message: 'is your own' },
      ]);
    }
  }
  await userRepository.update(userid, {
    ...changes,
    email: changes.email === '' ? null : changes.email,
  });
  return userRepository.findById(userid);
}

async function resetPassword(actorId, userid) {
  await get(userid);
  if (userid === actorId) {
    throw new AppError(
      422,
      'BUSINESS_RULE',
      'Use "Change password" in your profile for your own account',
    );
  }
  const password = temporaryPassword();
  await userRepository.setPassword(userid, await hashPassword(password), true);
  return { user: await userRepository.findById(userid), temporaryPassword: password };
}

module.exports = { list, get, lookup, create, createWithPassword, update, resetPassword };
