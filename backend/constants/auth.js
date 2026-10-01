// Roles, themes and session settings for authentication (PLAN.md §2.0).

const ROLE = Object.freeze({
  INSPECTOR: 'INSPECTOR',
  CHECKER: 'CHECKER',
  ADMIN: 'ADMIN',
});

const ROLES = Object.freeze(Object.values(ROLE));

// Roles that may sign off an inspection as "Checked by". Admins can do everything a checker can.
const CHECK_ROLES = Object.freeze([ROLE.CHECKER, ROLE.ADMIN]);

const THEMES = Object.freeze(['light', 'dark', 'system']);

// Employee NIK or a name like budi.santoso
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,50}$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72; // bcrypt ignores anything after 72 bytes

const SESSION_COOKIE = 'iqc_session';
// One shift; the cookie and the token expire together.
const SESSION_HOURS = 8;

const LOGIN_MAX_FAILURES = 5;
const LOGIN_WINDOW_MINUTES = 15;

module.exports = {
  ROLE,
  ROLES,
  CHECK_ROLES,
  THEMES,
  USERNAME_PATTERN,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  SESSION_COOKIE,
  SESSION_HOURS,
  LOGIN_MAX_FAILURES,
  LOGIN_WINDOW_MINUTES,
};
