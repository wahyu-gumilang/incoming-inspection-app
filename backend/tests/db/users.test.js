const db = require('../../config/db');
const { app, request, signIn } = require('./helpers');

let admin;
let inspector;

beforeAll(async () => {
  admin = await signIn('070203');
  inspector = await signIn('10187');
});
afterAll(() => db.close());

const adminId = async () =>
  (await request(app).get('/api/auth/me').set('Cookie', admin)).body.data.userid;
const idOf = async (username) => {
  const [rows] = await db.query('SELECT userid FROM usertable WHERE username = ?', [username]);
  return rows[0].userid;
};

describe('access', () => {
  it('needs a signed-in user', async () => {
    await request(app).get('/api/users').expect(401);
  });

  it('is Admin only, except the lookup', async () => {
    const res = await request(app).get('/api/users').set('Cookie', inspector);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    await request(app).get('/api/users/lookup?role=CHECKER').set('Cookie', inspector).expect(200);
  });
});

describe('GET /api/users', () => {
  it('lists users with paging meta, never password hashes', async () => {
    const res = await request(app).get('/api/users?limit=2&sort=username').set('Cookie', admin);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 2 });
    expect(res.body.meta.total).toBeGreaterThanOrEqual(6);
    expect(JSON.stringify(res.body)).not.toMatch(/password_hash|\$2[aby]\$/);
  });

  it('filters by search, role and active', async () => {
    const q = await request(app).get('/api/users?q=gumil').set('Cookie', admin);
    expect(q.body.data.map((u) => u.username)).toEqual(['070203']);
    const inactive = await request(app).get('/api/users?active=false').set('Cookie', admin);
    expect(inactive.body.data.map((u) => u.username)).toContain('10099');
    expect(inactive.body.data.every((u) => u.active === false)).toBe(true);
    const checkers = await request(app).get('/api/users?role=CHECKER').set('Cookie', admin);
    expect(checkers.body.data.every((u) => u.role === 'CHECKER')).toBe(true);
  });

  it('refuses an unknown sort column', async () => {
    await request(app).get('/api/users?sort=password_hash').set('Cookie', admin).expect(400);
  });
});

describe('GET /api/users/lookup', () => {
  it('lists who can check: active checkers and admins', async () => {
    const res = await request(app).get('/api/users/lookup?role=CHECKER').set('Cookie', admin);

    const names = res.body.data.map((u) => u.fullname);
    expect(names).toEqual(expect.arrayContaining(['Gumilang', 'Siti Rahayu']));
    expect(names).not.toContain('Budi Santoso');
    expect(Object.keys(res.body.data[0]).sort()).toEqual([
      'fullname',
      'role',
      'userid',
      'username',
    ]);
  });
});

describe('POST /api/users', () => {
  it('creates a user with a one-time temporary password', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Cookie', admin)
      .send({ username: '10412', fullname: 'Rina Kartika', role: 'INSPECTOR' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      username: '10412',
      role: 'INSPECTOR',
      must_change_password: true,
      active: true,
    });
    expect(res.body.data.temporaryPassword).toMatch(/^\w{5}-\w{5}$/);
    const signedIn = await request(app)
      .post('/api/auth/login')
      .send({ username: '10412', password: res.body.data.temporaryPassword });
    expect(signedIn.body.data.must_change_password).toBe(true);
  });

  it('answers 409 for a username that exists', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Cookie', admin)
      .send({ username: '10234', fullname: 'Someone', role: 'INSPECTOR' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_KEY');
  });

  it('validates username, name and role', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Cookie', admin)
      .send({ username: 'a b', fullname: '', role: 'BOSS' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual([
      'fullname',
      'role',
      'username',
    ]);
  });
});

describe('PUT /api/users/:userid', () => {
  // Uses 10412, created above in this file: the db test files run in parallel, and
  // auth.test signs in as the fixture users, so this file must not deactivate them.
  it('changes role and deactivates another user', async () => {
    const id = await idOf('10412');
    const res = await request(app)
      .put(`/api/users/${id}`)
      .set('Cookie', admin)
      .send({ role: 'CHECKER', active: false });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ role: 'CHECKER', active: false });
    await request(app)
      .put(`/api/users/${id}`)
      .set('Cookie', admin)
      .send({ role: 'INSPECTOR', active: true })
      .expect(200);
  });

  it("won't let an admin demote or deactivate themselves", async () => {
    const me = await adminId();
    const demote = await request(app)
      .put(`/api/users/${me}`)
      .set('Cookie', admin)
      .send({ role: 'INSPECTOR' });
    const deactivate = await request(app)
      .put(`/api/users/${me}`)
      .set('Cookie', admin)
      .send({ active: false });

    expect(demote.status).toBe(422);
    expect(deactivate.status).toBe(422);
    await request(app)
      .put(`/api/users/${me}`)
      .set('Cookie', admin)
      .send({ fullname: 'Gumilang' })
      .expect(200);
  });

  it('answers 404 for an unknown user', async () => {
    await request(app)
      .put('/api/users/999999')
      .set('Cookie', admin)
      .send({ fullname: 'X' })
      .expect(404);
  });
});

describe('POST /api/users/:userid/reset-password', () => {
  it('sets a new temporary password the user must change', async () => {
    const id = await idOf('10412');
    const res = await request(app).post(`/api/users/${id}/reset-password`).set('Cookie', admin);

    expect(res.status).toBe(200);
    expect(res.body.data.must_change_password).toBe(true);
    await request(app)
      .post('/api/auth/login')
      .send({ username: '10412', password: res.body.data.temporaryPassword })
      .expect(200);
  });

  it('is not for your own account', async () => {
    await request(app)
      .post(`/api/users/${await adminId()}/reset-password`)
      .set('Cookie', admin)
      .expect(422);
  });
});

describe('createWithPassword (npm run user:create-admin)', () => {
  const userService = require('../../services/user.service');

  it('creates an admin who signs in with their own password, no forced change', async () => {
    const user = await userService.createWithPassword(
      { username: 'first.admin', fullname: 'First Admin', role: 'ADMIN' },
      'Own-pass-789',
    );

    expect(user).toMatchObject({ role: 'ADMIN', must_change_password: false, active: true });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'first.admin', password: 'Own-pass-789' });
    expect(res.body.data.must_change_password).toBe(false);
  });

  it('refuses a username that exists', async () => {
    await expect(
      userService.createWithPassword(
        { username: '070203', fullname: 'Again', role: 'ADMIN' },
        'Own-pass-789',
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
});
