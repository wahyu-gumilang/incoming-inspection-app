// Auth settings from the environment. Read lazily so modules that never sign or
// verify a token (most unit tests) don't need JWT_SECRET.

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters (see .env.example)');
  }
  return secret;
}

function bcryptRounds() {
  // Tests lower this (BCRYPT_ROUNDS=4) to stay fast; production keeps the default.
  return Number(process.env.BCRYPT_ROUNDS) || 12;
}

function allowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || 'http://localhost:4200,http://localhost:5000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

const isProduction = () => process.env.NODE_ENV === 'production';

module.exports = { jwtSecret, bcryptRounds, allowedOrigins, isProduction };
