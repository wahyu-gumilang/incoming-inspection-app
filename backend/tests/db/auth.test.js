const db = require('../../config/db');
const authService = require('../../services/auth.service');
const { app, request, signIn, PASSWORD } = require('./helpers');

afterAll(() => db.close());
afterEach(() => authService.limiter.reset('rate.limited'));

describe('POST /api/auth/login', () => {
  it('signs in and sets an httpOnly, SameSite=Strict session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: '070203', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      username: '070203',
      fullname: 'Gumilang',
      role: 'ADMIN',
      active: true,
    });
    expect(res.body.data).not.toHaveProperty('password_hash');
    expect(res.body.data.last_login_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/^iqc_session=[^;]+/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Max-Age=28800/);
    expect(JSON.stringify(res.body)).not.toMatch(/eyJ/); // the token never appears in the body
  });

  it('gives a session cookie (no Max-Age) without "keep me signed in"', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: '10234', password: PASSWORD, remember: false });

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).not.toMatch(/Max-Age/);
  });

  it.each([
    ['a wrong password', '070203', 'nope-nope'],
    ['an unknown username', 'ghost', PASSWORD],
  ])('answers the same 401 for %s', async (_, username, password) => {
    const res = await request(app).post('/api/auth/login').send({ username, password });

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({
      code: 'UNAUTHENTICATED',
      message: 'Username or password is incorrect',
    });
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('refuses a deactivated account, but only after the right password', async () => {
    const wrong = await request(app)
      .post('/api/auth/login')
      .send({ username: '10099', password: 'nope-nope' });
    const right = await request(app)
      .post('/api/auth/login')
      .send({ username: '10099', password: PASSWORD });

    expect(wrong.status).toBe(401);
    expect(right.status).toBe(403);
    expect(right.body.error.message).toMatch(/deactivated/);
  });

  it('locks a username after 5 failed attempts with 429', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ username: 'rate.limited', password: 'x' })
        .expect(401);
    }
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'rate.limited', password: 'x' });

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
  });

  it('validates the body', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual(['password', 'username']);
  });

  it('refuses a sign-in posted from a foreign origin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ username: '070203', password: PASSWORD });
    expect(res.status).toBe(403);
  });
});

describe('session', () => {
  it('GET /api/auth/me returns the signed-in user', async () => {
    const cookie = await signIn('10234');
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      username: '10234',
      fullname: 'Siti Rahayu',
      role: 'CHECKER',
    });
  });

  it('answers 401 without a cookie or with a forged one', async () => {
    await request(app).get('/api/auth/me').expect(401);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'iqc_session=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.forged');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('logout clears the cookie', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(204);
    expect(res.headers['set-cookie'][0]).toMatch(/iqc_session=;.*Expires=Thu, 01 Jan 1970/);
  });

  it('a deactivated user loses access straight away, even with a valid cookie', async () => {
    const cookie = await signIn('10276');
    await db.query("UPDATE usertable SET active = 0 WHERE username = '10276'");
    try {
      await request(app).get('/api/auth/me').set('Cookie', cookie).expect(401);
    } finally {
      await db.query("UPDATE usertable SET active = 1 WHERE username = '10276'");
    }
  });
});

describe('own profile and password', () => {
  it('PUT /api/auth/me updates name, email and theme', async () => {
    const cookie = await signIn('10187');
    const res = await request(app)
      .put('/api/auth/me')
      .set('Cookie', cookie)
      .send({ fullname: 'Budi Santoso', email: 'budi@example.com', theme: 'dark' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ email: 'budi@example.com', theme: 'dark' });
    const cleared = await request(app)
      .put('/api/auth/me')
      .set('Cookie', cookie)
      .send({ email: '' });
    expect(cleared.body.data.email).toBeNull();
  });

  it('PUT /api/auth/me refuses an empty body and a bad theme', async () => {
    const cookie = await signIn('10187');
    await request(app).put('/api/auth/me').set('Cookie', cookie).send({}).expect(400);
    await request(app)
      .put('/api/auth/me')
      .set('Cookie', cookie)
      .send({ theme: 'pink' })
      .expect(400);
  });

  it('a user on a temporary password can only reach /api/auth until they change it', async () => {
    const cookie = await signIn('10305');

    const me = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(me.body.data.must_change_password).toBe(true);
    const blocked = await request(app).get('/api/users/lookup?role=CHECKER').set('Cookie', cookie);
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');

    const wrong = await request(app)
      .put('/api/auth/me/password')
      .set('Cookie', cookie)
      .send({ currentPassword: 'nope', newPassword: 'New-pass-456' });
    expect(wrong.status).toBe(422);
    const short = await request(app)
      .put('/api/auth/me/password')
      .set('Cookie', cookie)
      .send({ currentPassword: PASSWORD, newPassword: 'short' });
    expect(short.status).toBe(400);
    const same = await request(app)
      .put('/api/auth/me/password')
      .set('Cookie', cookie)
      .send({ currentPassword: PASSWORD, newPassword: PASSWORD });
    expect(same.status).toBe(422);

    const changed = await request(app)
      .put('/api/auth/me/password')
      .set('Cookie', cookie)
      .send({ currentPassword: PASSWORD, newPassword: 'New-pass-456' });
    expect(changed.status).toBe(200);
    expect(changed.body.data.must_change_password).toBe(false);
    await request(app).get('/api/users/lookup?role=CHECKER').set('Cookie', cookie).expect(200);
    await signIn('10305', 'New-pass-456');
    await request(app)
      .post('/api/auth/login')
      .send({ username: '10305', password: PASSWORD })
      .expect(401);
  });
});

describe('public routes', () => {
  it('health stays public', async () => {
    await request(app).get('/api/health').expect(200);
  });
});
