const { LOGIN_MAX_FAILURES, LOGIN_WINDOW_MINUTES } = require('../constants/auth');

// Counts failed logins per username in memory. After LOGIN_MAX_FAILURES failures
// inside the window the username is locked until the oldest failure ages out.
// Single-process only: with several Node processes this would move to the database.
function createLoginLimiter({
  maxFailures = LOGIN_MAX_FAILURES,
  windowMs = LOGIN_WINDOW_MINUTES * 60_000,
  now = Date.now,
} = {}) {
  const failures = new Map();

  const recent = (key) => {
    const cutoff = now() - windowMs;
    const list = (failures.get(key) || []).filter((t) => t > cutoff);
    if (list.length) failures.set(key, list);
    else failures.delete(key);
    return list;
  };

  const keyOf = (username) => String(username).toLowerCase();

  return {
    // Seconds until the next attempt is allowed, or 0 when not locked.
    retryAfter(username) {
      const list = recent(keyOf(username));
      if (list.length < maxFailures) return 0;
      return Math.ceil((list[0] + windowMs - now()) / 1000);
    },
    fail(username) {
      const key = keyOf(username);
      failures.set(key, [...recent(key), now()]);
    },
    reset(username) {
      failures.delete(keyOf(username));
    },
  };
}

module.exports = { createLoginLimiter };
