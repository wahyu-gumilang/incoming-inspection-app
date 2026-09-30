const fs = require('fs');
const net = require('net');
const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_PORT = Number(process.env.DB_PORT) || 3306;
const PROBE_TIMEOUT_MS = 1500;

// Errors that mean "the host is unreachable", as opposed to bad SQL/credentials.
// On these we drop the pool so the next query re-detects the host.
const NETWORK_ERRORS = new Set([
  'ETIMEDOUT',
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'PROTOCOL_CONNECTION_LOST',
]);

// Default gateway from /proc/net/route. Under WSL2 NAT networking this is the
// Windows host, and it changes across reboots.
function defaultGatewayIp() {
  try {
    const row = fs
      .readFileSync('/proc/net/route', 'utf8')
      .split('\n')
      .slice(1)
      .map((line) => line.trim().split(/\s+/))
      .find((cols) => cols[1] === '00000000');
    if (!row) return null;
    // Gateway is little-endian hex, e.g. 012018AC -> 172.24.32.1
    return [3, 2, 1, 0].map((i) => parseInt(row[2].substr(i * 2, 2), 16)).join('.');
  } catch {
    return null;
  }
}

// DB_HOST=auto (or unset) means: try localhost first (native Linux, or WSL
// mirrored networking), then the WSL default gateway. An explicit DB_HOST is
// tried first but still falls back to the same candidates.
function candidateHosts() {
  const configured = process.env.DB_HOST;
  const hosts = [
    configured && configured !== 'auto' ? configured : null,
    '127.0.0.1',
    defaultGatewayIp(),
  ];
  return [...new Set(hosts.filter(Boolean))];
}

function probe(host) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port: DB_PORT });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(PROBE_TIMEOUT_MS, () => done(false));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
  });
}

async function detectHost() {
  const hosts = candidateHosts();
  for (const host of hosts) {
    if (await probe(host)) return host;
  }
  const err = new Error(`MySQL not reachable on port ${DB_PORT} at: ${hosts.join(', ')}`);
  err.code = 'ETIMEDOUT';
  throw err;
}

async function createPool() {
  const host = await detectHost();
  console.log(`[db] Using MySQL at ${host}:${DB_PORT}`);
  return mysql.createPool({
    host,
    port: DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    // Return DATE columns (inspectdate, deliverydate1..7) as 'YYYY-MM-DD' strings
    // instead of JS Date objects, avoiding timezone shifts.
    dateStrings: true,
    // Return DECIMAL columns (standard, tolerance, actual_n, qty_receivedn) as numbers.
    decimalNumbers: true,
  });
}

let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    const pending = createPool();
    poolPromise = pending;
    pending.catch(() => {
      if (poolPromise === pending) poolPromise = null;
    });
  }
  return poolPromise;
}

async function withPool(fn) {
  const current = getPool();
  const pool = await current;
  try {
    return await fn(pool);
  } catch (err) {
    if (NETWORK_ERRORS.has(err.code) && poolPromise === current) {
      poolPromise = null;
      pool.end().catch(() => {});
    }
    throw err;
  }
}

// Same surface as a mysql2 pool for the methods the app uses.
module.exports = {
  query: (...args) => withPool((pool) => pool.query(...args)),
  execute: (...args) => withPool((pool) => pool.execute(...args)),
  getConnection: () => withPool((pool) => pool.getConnection()),
  getPool,
};
