const db = require('../config/db');

// Every column except password_hash, which only the auth lookups below read.
const PUBLIC_COLUMNS =
  'userid, username, fullname, email, role, active, must_change_password, theme, last_login_at, created_at, updated_at';

// Columns an update may touch; anything else in `fields` is ignored.
const UPDATABLE = ['fullname', 'email', 'role', 'active', 'theme'];

// DATETIME comes back as 'YYYY-MM-DD HH:MM:SS' (dateStrings); the API sends ISO 8601.
const isoDateTime = (v) => (v ? v.replace(' ', 'T') : null);

function toUser(row) {
  if (!row) return null;
  return {
    ...row,
    active: Boolean(row.active),
    must_change_password: Boolean(row.must_change_password),
    last_login_at: isoDateTime(row.last_login_at),
    created_at: isoDateTime(row.created_at),
    updated_at: isoDateTime(row.updated_at),
  };
}

function filters({ q, role, active }) {
  const where = [];
  const params = [];
  if (q) {
    where.push('(username LIKE ? OR fullname LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (role) {
    where.push('role = ?');
    params.push(role);
  }
  if (active !== undefined) {
    where.push('active = ?');
    params.push(active ? 1 : 0);
  }
  return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

async function findAuthByUsername(username, conn = db) {
  const [rows] = await conn.execute(
    `SELECT ${PUBLIC_COLUMNS}, password_hash FROM usertable WHERE username = ?`,
    [username],
  );
  if (!rows[0]) return null;
  const { password_hash: passwordHash, ...user } = rows[0];
  return { user: toUser(user), passwordHash };
}

async function findPasswordHash(userid, conn = db) {
  const [rows] = await conn.execute('SELECT password_hash FROM usertable WHERE userid = ?', [
    userid,
  ]);
  return rows[0] ? rows[0].password_hash : null;
}

async function findById(userid, conn = db) {
  const [rows] = await conn.execute(`SELECT ${PUBLIC_COLUMNS} FROM usertable WHERE userid = ?`, [
    userid,
  ]);
  return toUser(rows[0]);
}

async function list({ q, role, active, orderBy, limit, offset }, conn = db) {
  const { sql, params } = filters({ q, role, active });
  // orderBy comes from resolveSort() and its column whitelist; limit/offset are validated integers.
  const [rows] = await conn.query(
    `SELECT ${PUBLIC_COLUMNS} FROM usertable ${sql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  return rows.map(toUser);
}

async function count({ q, role, active }, conn = db) {
  const { sql, params } = filters({ q, role, active });
  const [rows] = await conn.execute(`SELECT COUNT(*) AS total FROM usertable ${sql}`, params);
  return rows[0].total;
}

async function lookup(roles, conn = db) {
  const [rows] = await conn.query(
    'SELECT userid, username, fullname, role FROM usertable WHERE active = 1 AND role IN (?) ORDER BY fullname',
    [roles],
  );
  return rows;
}

async function insert(user, conn = db) {
  const [result] = await conn.execute(
    `INSERT INTO usertable (username, fullname, email, role, password_hash, must_change_password)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      user.username,
      user.fullname,
      user.email ?? null,
      user.role,
      user.password_hash,
      user.must_change_password ? 1 : 0,
    ],
  );
  return result.insertId;
}

async function update(userid, fields, conn = db) {
  const keys = UPDATABLE.filter((k) => fields[k] !== undefined);
  if (!keys.length) return;
  const values = keys.map((k) => (k === 'active' ? (fields[k] ? 1 : 0) : fields[k]));
  await conn.execute(
    `UPDATE usertable SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE userid = ?`,
    [...values, userid],
  );
}

async function setPassword(userid, passwordHash, mustChange, conn = db) {
  await conn.execute(
    'UPDATE usertable SET password_hash = ?, must_change_password = ? WHERE userid = ?',
    [passwordHash, mustChange ? 1 : 0, userid],
  );
}

async function touchLogin(userid, conn = db) {
  await conn.execute('UPDATE usertable SET last_login_at = current_timestamp() WHERE userid = ?', [
    userid,
  ]);
}

module.exports = {
  findAuthByUsername,
  findPasswordHash,
  findById,
  list,
  count,
  lookup,
  insert,
  update,
  setPassword,
  touchLogin,
};
