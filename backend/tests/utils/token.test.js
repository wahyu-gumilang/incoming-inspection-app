const jwt = require('jsonwebtoken');

const SECRET = 'unit-test-secret-0123456789abcdefghij';

describe('session token', () => {
  let token;

  beforeAll(() => {
    process.env.JWT_SECRET = SECRET;
    token = require('../../utils/token');
  });

  it('round-trips the user id', () => {
    expect(token.verifySession(token.signSession(42))).toBe(42);
  });

  it('expires after one shift (8 h)', () => {
    const { iat, exp } = jwt.decode(token.signSession(1));
    expect(exp - iat).toBe(8 * 3600);
  });

  it.each([
    ['missing', undefined],
    ['garbage', 'not-a-token'],
    ['other secret', jwt.sign({ sub: '1' }, 'another-secret-0123456789abcdefghijkl')],
    ['expired', jwt.sign({ sub: '1', exp: Math.floor(Date.now() / 1000) - 10 }, SECRET)],
    ['alg none', jwt.sign({ sub: '1' }, null, { algorithm: 'none' })],
    ['bad subject', jwt.sign({ sub: 'abc' }, SECRET)],
  ])('rejects a %s token', (_, t) => {
    expect(token.verifySession(t)).toBeNull();
  });

  it('refuses to work with a short secret', () => {
    process.env.JWT_SECRET = 'short';
    expect(() => token.signSession(1)).toThrow(/JWT_SECRET/);
    process.env.JWT_SECRET = SECRET;
  });
});
