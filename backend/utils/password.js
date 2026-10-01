const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { bcryptRounds } = require('../config/auth');

function hashPassword(plain) {
  return bcrypt.hash(plain, bcryptRounds());
}

function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// No 0/O/1/l/I, so it can be read out loud or copied from a screen without mistakes.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function temporaryPassword(length = 10) {
  const bytes = crypto.randomBytes(length);
  const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('');
  return `${chars.slice(0, 5)}-${chars.slice(5)}`;
}

module.exports = { hashPassword, verifyPassword, temporaryPassword };
