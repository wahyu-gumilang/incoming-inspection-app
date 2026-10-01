// npm run user:create-admin [-- --username 070203 --name "Gumilang"]
// Creates an Admin account. The password is typed at a hidden prompt (twice) and
// never accepted as an argument, so it can't end up in shell history.
const readline = require('readline');
const {
  ROLE,
  USERNAME_PATTERN,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} = require('../constants/auth');

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    }),
  );
}

// Reads a line without echoing it.
function askHidden(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error('Run this in a terminal: the password prompt needs an interactive TTY'));
      return;
    }
    process.stdout.write(question);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    // A paste arrives as one chunk, so handle it character by character.
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n' || ch === '\u0004') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(value);
          return;
        }
        if (ch === '\u0003') {
          process.stdout.write('\n');
          process.exit(130);
        }
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on('data', onData);
  });
}

async function main() {
  const db = require('../config/db');
  const userService = require('../services/user.service');

  const username = arg('username') || (await ask('Username (e.g. employee NIK): '));
  if (!USERNAME_PATTERN.test(username))
    throw new Error('Username must be 3–50 letters, digits, dots, dashes or underscores');
  const fullname = arg('name') || (await ask('Full name (as printed on the check sheet): '));
  if (!fullname || fullname.length > 50)
    throw new Error('Full name is required (max 50 characters)');

  const password = await askHidden(`Password (min ${PASSWORD_MIN_LENGTH} characters): `);
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw new Error(`Password must be ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters`);
  }
  if ((await askHidden('Repeat password: ')) !== password)
    throw new Error('Passwords do not match');

  try {
    const [[{ name }]] = await db.query('SELECT DATABASE() AS name');
    const user = await userService.createWithPassword(
      { username, fullname, role: ROLE.ADMIN },
      password,
    );
    console.log(
      `Created Admin "${user.fullname}" (@${user.username}, userid ${user.userid}) in ${name}.`,
    );
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error(`Could not create the admin: ${err.message}`);
  process.exit(1);
});
