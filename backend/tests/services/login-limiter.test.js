const { createLoginLimiter } = require('../../services/login-limiter');

describe('login limiter', () => {
  let clock;
  let limiter;

  beforeEach(() => {
    clock = 1_000_000;
    limiter = createLoginLimiter({ maxFailures: 3, windowMs: 60_000, now: () => clock });
  });

  it('allows attempts below the limit', () => {
    limiter.fail('070203');
    limiter.fail('070203');
    expect(limiter.retryAfter('070203')).toBe(0);
  });

  it('locks a username after the limit, until the oldest failure ages out', () => {
    limiter.fail('070203');
    clock += 10_000;
    limiter.fail('070203');
    limiter.fail('070203');

    expect(limiter.retryAfter('070203')).toBe(50);
    clock += 50_001;
    expect(limiter.retryAfter('070203')).toBe(0);
  });

  it('treats usernames case-insensitively and keeps them apart', () => {
    ['admin', 'ADMIN', 'Admin'].forEach((u) => limiter.fail(u));
    expect(limiter.retryAfter('admin')).toBeGreaterThan(0);
    expect(limiter.retryAfter('10234')).toBe(0);
  });

  it('forgets failures after a successful sign-in', () => {
    ['x', 'x', 'x'].forEach((u) => limiter.fail(u));
    limiter.reset('x');
    expect(limiter.retryAfter('x')).toBe(0);
  });
});
