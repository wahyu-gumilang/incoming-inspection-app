const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

// WSL has no MySQL client; XAMPP's Windows mysqldump.exe runs fine from here
// and connects to the same server on the Windows host.
const CANDIDATES = [process.env.MYSQLDUMP, 'mysqldump', '/mnt/c/xampp/mysql/bin/mysqldump.exe'];

function findMysqldump() {
  for (const candidate of CANDIDATES.filter(Boolean)) {
    if (!candidate.includes('/')) {
      const dirs = (process.env.PATH || '').split(path.delimiter);
      if (dirs.some((dir) => fs.existsSync(path.join(dir, candidate)))) return candidate;
    } else if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error('mysqldump not found; set MYSQLDUMP in .env to its path');
}

// Local time, so the file name matches the clock of the person restoring it.
function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

async function main() {
  const dir = process.env.DB_BACKUP_DIR;
  if (!dir) throw new Error('Set DB_BACKUP_DIR in .env (a folder outside the repo)');
  if (path.resolve(dir).startsWith(path.resolve(__dirname, '..', '..'))) {
    throw new Error('DB_BACKUP_DIR is inside the repository; backups contain real data');
  }
  fs.mkdirSync(dir, { recursive: true });

  const name = process.env.DB_NAME;
  const file = path.join(dir, `${name}-${timestamp()}.sql`);
  const args = [
    '--host=127.0.0.1',
    `--port=${process.env.DB_PORT || 3306}`,
    `--user=${process.env.DB_USER}`,
    '--single-transaction',
    '--routines',
    '--triggers',
    '--databases',
    name,
  ];

  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(file);
    const child = spawn(findMysqldump(), args, {
      // The password goes through the environment, not the command line.
      env: { ...process.env, MYSQL_PWD: process.env.DB_PASS || '', WSLENV: 'MYSQL_PWD/u' },
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    child.stdout.pipe(out);
    child.on('error', reject);
    child.on('close', (code) =>
      out.close(() => (code === 0 ? resolve() : reject(new Error(`mysqldump exited ${code}`)))),
    );
  });

  const size = fs.statSync(file).size;
  if (size === 0) throw new Error(`Backup ${file} is empty`);
  console.log(`Backed up ${name} to ${file} (${(size / 1024 / 1024).toFixed(1)} MB)`);
}

main().catch((err) => {
  console.error(`Backup failed: ${err.message}`);
  process.exit(1);
});
