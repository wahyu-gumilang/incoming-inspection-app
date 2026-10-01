// users.js — the mockup's user directory and session, shared by login.html and every app page.
// In the app these are rows in usertable, the password is checked by POST /api/auth/login
// and the session is an httpOnly cookie. The mockup accepts any non-empty password.

const ROLE_LABEL = { ADMIN: 'Admin', CHECKER: 'Checker', INSPECTOR: 'Inspector' };

const USERS = {
  '070203': { name: 'Gumilang', initials: 'G', role: 'ADMIN', email: '', active: true, lastSignIn: 'Today, 08:02', avatar: 'linear-gradient(135deg, var(--brand), var(--sky))' },
  '10234': { name: 'Siti Rahayu', initials: 'SR', role: 'CHECKER', email: '', active: true, lastSignIn: 'Today, 07:58', avatar: 'linear-gradient(135deg, #db2777, var(--violet))' },
  '10187': { name: 'Budi Santoso', initials: 'BS', role: 'INSPECTOR', email: '', active: true, lastSignIn: 'Today, 07:31', avatar: 'linear-gradient(135deg, var(--teal), var(--sky))' },
  '10276': { name: 'Dewi Lestari', initials: 'DL', role: 'INSPECTOR', email: '', active: true, lastSignIn: 'Yesterday, 15:12', avatar: 'linear-gradient(135deg, var(--amber), var(--ng))' },
  '10305': { name: 'Andi Wijaya', initials: 'AW', role: 'INSPECTOR', email: '', active: true, mustChangePassword: true, lastSignIn: '—', avatar: 'linear-gradient(135deg, var(--violet), var(--sky))' },
  '10099': { name: 'Rudi Hartono', initials: 'RH', role: 'INSPECTOR', email: '', active: false, lastSignIn: '12 Aug 2026', avatar: '#94a3b8' },
};

const SESSION_KEY = 'iqc-user';

function currentUsername() {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch (e) {
    return null;
  }
}

function currentUser() {
  const username = currentUsername();
  const user = username && USERS[username];
  return user && user.active ? { username, ...user, roleLabel: ROLE_LABEL[user.role] } : null;
}

// Same answer for an unknown username and a wrong password, like the real API.
function signIn(username, password) {
  const user = USERS[username];
  if (!user || !password) return { error: 'Username or password is incorrect.' };
  if (!user.active) return { error: 'This account is deactivated. Ask a QC administrator.' };
  try {
    localStorage.setItem(SESSION_KEY, username);
  } catch (e) {}
  return { user };
}

function signOut() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {}
}

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Good morning';
  if (h < 15) return 'Good afternoon';
  return 'Good evening';
}
