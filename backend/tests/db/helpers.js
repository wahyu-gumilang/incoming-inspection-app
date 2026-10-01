const request = require('supertest');
const app = require('../../app');

const PASSWORD = 'Test-pass-123';

// Signs in and returns the session cookie to send on later requests.
async function signIn(username, password = PASSWORD) {
  const res = await request(app).post('/api/auth/login').send({ username, password });
  if (res.status !== 200)
    throw new Error(`sign-in as ${username} failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.headers['set-cookie'].map((c) => c.split(';')[0]);
}

module.exports = { app, request, signIn, PASSWORD };
