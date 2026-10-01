process.env.BCRYPT_ROUNDS = '4';
const { hashPassword, verifyPassword, temporaryPassword } = require('../../utils/password');

describe('password', () => {
  it('hashes with bcrypt and verifies', async () => {
    const hash = await hashPassword('Test-pass-123');

    expect(hash).toMatch(/^\$2[aby]\$04\$/);
    expect(hash).not.toContain('Test-pass-123');
    await expect(verifyPassword('Test-pass-123', hash)).resolves.toBe(true);
    await expect(verifyPassword('test-pass-123', hash)).resolves.toBe(false);
  });

  it('makes readable temporary passwords that differ every time', () => {
    const a = temporaryPassword();
    const b = temporaryPassword();

    expect(a).toMatch(/^[A-HJ-NP-Za-km-np-z2-9]{5}-[A-HJ-NP-Za-km-np-z2-9]{5}$/);
    expect(a).not.toBe(b);
  });
});
