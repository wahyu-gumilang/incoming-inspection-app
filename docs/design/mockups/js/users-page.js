// users-page.js — the user list (Admin only) is built from the same directory the login uses.
const ROLE_CHIP = { ADMIN: 'chip-violet', CHECKER: 'chip-brand', INSPECTOR: 'chip-info' };

function statusChip(u) {
  if (!u.active) return '<span class="chip chip-neutral"><span class="dot"></span>Inactive</span>';
  if (u.mustChangePassword) return '<span class="chip chip-warn"><span class="dot"></span>Must change password</span>';
  return '<span class="chip chip-ok"><span class="dot"></span>Active</span>';
}

function renderUsers() {
  const body = document.getElementById('user-rows');
  if (!body) return;
  const me = currentUsername();
  // Sorted by name: numeric usernames would otherwise come out in key order, not as listed.
  body.innerHTML = Object.entries(USERS)
    .sort(([, a], [, b]) => a.name.localeCompare(b.name))
    .map(
      ([username, u]) => `<tr class="clickable ${u.active ? '' : 'row-inactive'}" data-username="${username}">
        <td><div class="user-cell"><span class="avatar" style="background:${u.avatar}">${u.initials}</span><b>${u.name}</b>${username === me ? '<span class="chip chip-neutral" style="height:22px">You</span>' : ''}</div></td>
        <td class="mono">${username}</td>
        <td><span class="chip ${u.active ? ROLE_CHIP[u.role] : 'chip-neutral'}">${ROLE_LABEL[u.role]}</span></td>
        <td>${statusChip(u)}</td>
        <td>${u.lastSignIn}</td>
      </tr>`,
    )
    .join('');
  body.querySelectorAll('tr').forEach((tr) => tr.addEventListener('click', () => openUser(tr.dataset.username)));
}

function openUser(username) {
  const u = USERS[username];
  const self = username === currentUsername();
  document.getElementById('m-edit-user-title').textContent = u.name;
  document.getElementById('m-edit-user-sub').textContent = `@${username} · usernames can't be changed. Users are deactivated, never deleted.`;
  document.getElementById('eu-name').value = u.name;
  document.getElementById('eu-role').value = u.role;
  document.getElementById('eu-active').checked = u.active;
  document.getElementById('eu-role').disabled = self;
  document.getElementById('eu-active').disabled = self;
  document.getElementById('eu-self').classList.toggle('hidden', !self);
  openModal('m-edit-user');
}

document.addEventListener('DOMContentLoaded', renderUsers);
