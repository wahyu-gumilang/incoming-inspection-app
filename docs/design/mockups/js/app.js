// app.js — shared behaviour for every page after login:
// the navbar (written once here), profile menu, theme, modals and toasts.
// Each page sets <body data-page="…"> to mark its menu entry as active.
// Needs js/users.js first. Everything user-specific comes from the signed-in user:
//   data-user="name|initials|username|role|email"  → filled with that field
//   data-requires="ADMIN" / "CHECKER,ADMIN"        → removed for other roles
//   data-open-roles="ADMIN"                         → only these roles can open its modal

const NAV = [
  { page: 'dashboard', label: 'Dashboard', icon: 'space_dashboard', href: 'dashboard.html' },
  { page: 'inspections', label: 'Inspections', icon: 'fact_check', href: 'inspections.html', badge: 7 },
  {
    label: 'Master data',
    icon: 'database',
    children: [
      { page: 'items', label: 'Items & standards', hint: 'Parts and their QC standards', icon: 'inventory_2', href: 'items.html' },
      { page: 'vendors', label: 'Vendors', hint: 'Suppliers', icon: 'local_shipping', href: 'vendors.html' },
      { page: 'aql', label: 'AQL table', hint: 'Sample size and Ac / Re', icon: 'table_chart', href: 'aql.html' },
    ],
  },
  { page: 'users', label: 'Users', icon: 'group', href: 'users.html', roles: ['ADMIN'] },
];

// Pages that belong to a menu entry without being in the menu themselves.
const PARENT = { 'inspection-detail': 'inspections', profile: null };

function renderNavbar(me) {
  const page = document.body.dataset.page;
  const active = page in PARENT ? PARENT[page] : page;
  const nav = NAV.filter((n) => !n.roles || n.roles.includes(me.role));

  const desktop = nav.map((n) => {
    if (n.children) {
      const on = n.children.some((c) => c.page === active);
      return `<div class="dd ${on ? 'active' : ''}">
        <button type="button" aria-haspopup="menu" aria-expanded="false">${n.label}<span class="icon">expand_more</span></button>
        <div class="dropdown" role="menu">${n.children
          .map(
            (c) =>
              `<a href="${c.href}" role="menuitem" class="${c.page === active ? 'active' : ''}"><span class="icon">${c.icon}</span><span>${c.label}<small>${c.hint}</small></span></a>`,
          )
          .join('')}</div>
      </div>`;
    }
    return `<a href="${n.href}" class="${n.page === active ? 'active' : ''}">${n.label}${n.badge ? `<span class="badge">${n.badge}</span>` : ''}</a>`;
  }).join('');

  const mobile = nav.map((n) =>
    n.children
      ? `<div class="group">${n.label}</div>${n.children
          .map((c) => `<a href="${c.href}" class="${c.page === active ? 'active' : ''}"><span class="icon">${c.icon}</span>${c.label}</a>`)
          .join('')}`
      : `<a href="${n.href}" class="${n.page === active ? 'active' : ''}"><span class="icon">${n.icon}</span>${n.label}</a>`,
  ).join('');

  document.getElementById('navbar').outerHTML = `
  <header class="navbar">
    <div class="navbar-inner">
      <button class="icon-btn menu-btn" type="button" aria-label="Open menu" aria-expanded="false"><span class="icon">menu</span></button>
      <a class="brand" href="dashboard.html" aria-label="Chubbsafes · Dashboard">
        <img class="logo-light" src="assets/logo-original.png" alt="Chubbsafes" />
        <img class="logo-dark" src="assets/logo-white.png" alt="Chubbsafes" />
      </a>
      <nav class="mainnav" aria-label="Main">${desktop}</nav>
      <span class="spacer"></span>
      <span class="api-chip" title="db: connected · checked 10:41"><span class="pulse"></span><span class="txt">All systems online</span></span>
      <div class="profile">
        <button class="profile-btn" type="button" aria-haspopup="menu" aria-expanded="false">
          <span class="avatar" style="background:${me.avatar}">${me.initials}</span>
          <span class="who"><b>${me.name}</b><span>QC ${me.roleLabel}</span></span>
          <span class="icon subtle" style="font-size:20px">expand_more</span>
        </button>
        <div class="dropdown" role="menu">
          <div class="menu-head"><span class="avatar" style="background:${me.avatar}">${me.initials}</span><div><b>${me.name}</b><br /><span>@${me.username} · ${me.roleLabel}</span></div></div>
          <a href="profile.html" role="menuitem" class="${page === 'profile' ? 'active' : ''}"><span class="icon">person</span>Profile settings</a>
          <div class="sep"></div>
          <div class="label">Theme</div>
          <div class="seg" role="radiogroup" aria-label="Theme">
            <button type="button" data-theme-mode="light"><span class="icon">light_mode</span>Light</button>
            <button type="button" data-theme-mode="dark"><span class="icon">dark_mode</span>Dark</button>
            <button type="button" data-theme-mode="system"><span class="icon">computer</span>Auto</button>
          </div>
          <div class="sep"></div>
          <a href="login.html" role="menuitem" class="item danger" id="logout"><span class="icon">logout</span>Log out</a>
        </div>
      </div>
    </div>
  </header>
  <nav class="mobile-nav" aria-label="Main">${mobile}</nav>
  <div class="nav-scrim"></div>`;
}

/* ---------- Dropdowns, ☰ panel ---------- */
function closeDropdowns(except) {
  document.querySelectorAll('.dd.open, .profile.open').forEach((el) => {
    if (el === except) return;
    el.classList.remove('open');
    el.querySelector('button').setAttribute('aria-expanded', 'false');
  });
}

function wireNavbar() {
  document.querySelectorAll('.dd > button, .profile-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const holder = btn.parentElement;
      closeDropdowns(holder);
      holder.classList.toggle('open');
      btn.setAttribute('aria-expanded', holder.classList.contains('open'));
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) closeDropdowns();
  });

  const menuBtn = document.querySelector('.menu-btn');
  menuBtn.addEventListener('click', () => {
    document.body.classList.toggle('mobile-open');
    menuBtn.setAttribute('aria-expanded', document.body.classList.contains('mobile-open'));
  });
  document.querySelector('.nav-scrim').addEventListener('click', () => document.body.classList.remove('mobile-open'));

  document.querySelectorAll('[data-theme-mode]').forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.themeMode)));
  markTheme();
  document.getElementById('logout').addEventListener('click', signOut);
}

/* ---------- Signed-in user on the page ---------- */
function applyUser(me) {
  const values = { name: me.name, initials: me.initials, username: me.username, role: me.roleLabel, email: me.email || 'Not set' };
  document.querySelectorAll('[data-user]').forEach((el) => {
    const v = values[el.dataset.user];
    if ('value' in el && el.tagName !== 'BUTTON') el.value = el.dataset.user === 'email' ? me.email : v;
    else el.textContent = v;
    if (el.classList.contains('avatar')) el.style.background = me.avatar;
  });
  document.querySelectorAll('[data-greeting]').forEach((el) => (el.textContent = greeting()));
  // data-open-roles: only these roles may open the modal (e.g. editing a vendor row)
  document.querySelectorAll('[data-open-roles]').forEach((el) => {
    if (el.dataset.openRoles.split(',').includes(me.role)) return;
    el.removeAttribute('data-open');
    el.classList.remove('clickable');
  });
  document.querySelectorAll('[data-requires]').forEach((el) => {
    if (!el.dataset.requires.split(',').includes(me.role)) el.remove();
  });
}

/* ---------- Theme (only switchable from the profile menu) ---------- */
function setTheme(mode) {
  try {
    localStorage.setItem('iqc-theme', mode);
  } catch (e) {}
  const dark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  markTheme();
}

function markTheme() {
  let mode = 'light';
  try {
    mode = localStorage.getItem('iqc-theme') || 'light';
  } catch (e) {}
  document.querySelectorAll('[data-theme-mode]').forEach((b) => b.classList.toggle('on', b.dataset.themeMode === mode));
}

/* ---------- Modals (shared/ui/modal) ---------- */
const modalStack = [];

function openModal(id) {
  const el = document.getElementById(id);
  modalStack.push({ el, returnFocus: document.activeElement });
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    const first = el.querySelector('[autofocus], input:not([disabled]), select, textarea, button.btn-primary');
    if (first) first.focus();
  }, 120);
}

function closeModal() {
  const top = modalStack.pop();
  if (!top) return;
  top.el.classList.remove('open');
  if (!modalStack.length) document.body.style.overflow = '';
  if (top.returnFocus) top.returnFocus.focus();
}

function wireModals() {
  document.querySelectorAll('.modal-backdrop').forEach((bd) =>
    bd.addEventListener('click', (e) => {
      if (e.target === bd) closeModal();
    }),
  );
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeModal));
  document.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => openModal(b.dataset.open)));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (modalStack.length) closeModal();
    else {
      closeDropdowns();
      document.body.classList.remove('mobile-open');
    }
  });
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(message) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.innerHTML = `<span class="icon fill">check_circle</span>${message}`;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------- Simple chip filters (visual only in the mockup) ---------- */
function wireFilterChips() {
  document.querySelectorAll('.filter-chips, .tabs[data-visual]').forEach((group) =>
    group.querySelectorAll('button').forEach((b) =>
      b.addEventListener('click', () => {
        group.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
      }),
    ),
  );
}

// Pages behind the login send you to login.html when nobody is signed in.
const ME = document.body.dataset.page ? currentUser() : null;
if (document.body.dataset.page && !ME) location.replace('login.html');

document.addEventListener('DOMContentLoaded', () => {
  if (ME) {
    renderNavbar(ME);
    wireNavbar();
    applyUser(ME);
  }
  wireModals();
  wireFilterChips();
});
