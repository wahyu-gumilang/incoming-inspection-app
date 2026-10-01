// inspection-detail.js — read-only check sheet + the 3-step delivery modal.
// Same rules as the server: OK/NG in integer hundredths, AQL sample from the plan,
// NG pieces ≥ 1 when a value is NG, Accepted only up to Ac, Concession only from Re with a note.

const COLS = 7;

// Standards of 000-228 Handle Rhino Prima (real csi_db rows)
const LINES = [
  { item: 'A', std: '12.5', s: 12.5, tol: '±0.4', plus: 0.4, minus: 0.4 },
  { item: 'B', std: 'Ø16', s: 16.0, tol: '+0.3/-0', plus: 0.3, minus: 0 },
  { item: 'D', std: '28.0', s: 28.0, tol: '±0.4', plus: 0.4, minus: 0.4 },
];
const VISUAL = ['Black', 'Cat Rata / Tidak Belang', 'Tidak Gores'];
const FITTING = [{ item: 'C', std: 'M8', tol: 'Fitting OK' }];
const HAS_COA = false; // 000-228 has no CERTIFIKAT standard

const isNew = new URLSearchParams(location.search).has('new');

let DELIVERIES = isNew
  ? []
  : [
      { po: '33932', date: '2026-09-15', qty: 50, cat: 'N', actual: ['12.62', '16.12', '27.88'], visual: ['OK', 'OK', 'OK'], fitting: ['OK'], ng: 0, j: 'o', note: '', qf: '' },
      { po: '34071', date: '2026-09-24', qty: 20, cat: 'N', actual: ['12.48', '16.35', '28.05'], visual: ['OK', 'OK', 'OK'], fitting: ['OK'], ng: 1, j: 'c', note: 'Burr on B, accepted by PPIC', qf: 'QF 01-05' },
      { po: '34561', date: '2026-10-01', qty: 100, cat: 'N', actual: ['12.71', '16.20', '28.21'], visual: ['OK', 'OK', 'OK'], fitting: ['OK'], ng: 0, j: 'o', note: '', qf: '' },
    ];

// An existing inspection was made by Budi Santoso; a new one by whoever is signed in.
const INSPECTOR = isNew ? ME : USERS['10187'];

if (isNew) {
  document.getElementById('insp-no').textContent = 'INS-000129';
  document.title = 'INS-000129 · Incoming Inspection';
}

/* ---------- Rules ---------- */
const hundredths = (v) => Math.round(Number(v) * 100);

function judge(line, raw) {
  if (raw === '' || raw == null || isNaN(Number(raw))) return null;
  const a = hundredths(raw);
  const s = hundredths(line.s);
  return a >= s - hundredths(line.minus) && a <= s + hundredths(line.plus) ? 'OK' : 'NG';
}

function gridNg(d) {
  const dims = LINES.filter((l, i) => judge(l, d.actual[i]) === 'NG').length;
  return dims + d.visual.filter((v) => v === 'NG').length + d.fitting.filter((v) => v === 'NG').length;
}

const pill = (r) => (r ? `<span class="okng ${r === 'OK' ? 'ok' : 'ng'}">${r}</span>` : '<span class="okng none">–</span>');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—');
const MARK = { o: 'O', x: 'X', c: 'C' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* ---------- Read-only check sheet ---------- */
function renderSheet() {
  const used = DELIVERIES.length;
  document.getElementById('used-count').textContent = `· ${used} of ${COLS} deliveries`;
  document.getElementById('add-delivery').disabled = used >= COLS;
  document.getElementById('submit-btn').disabled = used === 0;

  let head = '<th class="sx sx0 group" rowspan="2">No.</th><th class="sx sx1 group" rowspan="2">Item</th><th class="sx sx2 group" rowspan="2">Standard</th><th class="sx sx3 group" rowspan="2">Tolerance</th>';
  let sub = '';
  for (let c = 0; c < COLS; c++) {
    const d = DELIVERIES[c];
    let cell;
    if (d) cell = `<button class="col-btn" type="button" data-edit="${c}" aria-label="Open delivery ${c + 1}">Delivery ${c + 1}<span class="icon edit">edit</span><small>${fmtDate(d.date)} · P/O ${esc(d.po)}</small></button>`;
    else if (c === used) cell = `<button class="col-btn add" type="button" data-add aria-label="Add delivery ${c + 1}"><span class="icon">add</span>Add delivery</button>`;
    else cell = `<span class="col-empty">Delivery ${c + 1}</span>`;
    head += `<th colspan="2" class="${d || c === used ? '' : 'unused'}">${cell}</th>`;
    sub += `<th class="${d ? '' : 'unused'}">Actual</th><th class="${d ? '' : 'unused'}">OK/NG</th>`;
  }
  document.getElementById('sheet-head').innerHTML = head;
  document.getElementById('sheet-subhead').innerHTML = sub;

  const rows = [];
  const cells = (fn) => {
    let html = '';
    for (let c = 0; c < COLS; c++) html += fn(DELIVERIES[c], c);
    return html;
  };

  LINES.forEach((l, li) => {
    rows.push(`<tr><td class="sx sx0 subtle">${li + 1}</td><td class="sx sx1">${l.item}</td><td class="sx sx2">${l.std}</td><td class="sx sx3">${l.tol}</td>${cells((d) => {
      if (!d) return '<td class="act unused"></td><td class="res unused"></td>';
      const r = judge(l, d.actual[li]);
      return `<td class="act ${r === 'NG' ? 'ng' : ''}">${esc(d.actual[li] || '')}</td><td class="res">${pill(r)}</td>`;
    })}</tr>`);
  });

  const section = (title) => `<tr class="section"><td class="sx sxspan" colspan="4" style="text-align:left !important">${title}</td><td colspan="${COLS * 2}"></td></tr>`;
  rows.push(section('Certificate No'));
  rows.push(`<tr><td class="sx sx0"></td><td class="sx sx1 subtle">${HAS_COA ? 'COA NO.' : 'Not required'}</td><td class="sx sx2"></td><td class="sx sx3"></td>${cells((d) => `<td class="act ${d ? '' : 'unused'}"></td><td class="res ${d ? '' : 'unused'}"></td>`)}</tr>`);
  rows.push(section('Visual'));
  VISUAL.forEach((v, vi) => rows.push(`<tr><td class="sx sx0"></td><td class="sx sx1">${v}</td><td class="sx sx2"></td><td class="sx sx3"></td>${cells((d) => (d ? `<td class="act"></td><td class="res">${pill(d.visual[vi])}</td>` : '<td class="act unused"></td><td class="res unused"></td>'))}</tr>`));
  rows.push(section('Fitting'));
  FITTING.forEach((f, fi) => rows.push(`<tr><td class="sx sx0"></td><td class="sx sx1">${f.item}</td><td class="sx sx2">${f.std}</td><td class="sx sx3">${f.tol}</td>${cells((d) => (d ? `<td class="act"></td><td class="res">${pill(d.fitting[fi])}</td>` : '<td class="act unused"></td><td class="res unused"></td>'))}</tr>`));

  const foot = (label, fn, cls = '') => `<tr class="foot ${cls}"><th class="sx sxspan" colspan="4">${label}</th>${cells((d, c) => `<td colspan="2" class="${d ? '' : 'unused'}">${d ? fn(d, c) : '—'}</td>`)}</tr>`;
  rows.push(foot('P/O No.', (d) => `<span class="mono">${esc(d.po)}</span>`));
  rows.push(foot('Delivery date', (d) => fmtDate(d.date)));
  rows.push(`<tr class="foot instrument"><th class="sx sxspan" colspan="4">Measuring Instrument</th><td colspan="${COLS * 2}">${esc(document.getElementById('kv-inst').textContent)}</td></tr>`);
  rows.push(foot('QTY received / Insp. category *)', (d) => `<span class="mono">${d.qty}</span> / ${d.cat === 'F' ? '—' : d.cat}`));
  rows.push(foot('Sample size (AQL)', (d) => {
    const p = aqlLookup(DEFAULT_PLAN, d.cat, d.qty);
    return p ? `<span class="aql-cell">${p.n} pcs${p.full ? ' · 100 %' : ''}<span>Ac ${p.ac} · Re ${p.re}</span></span>` : '—';
  }, 'aql'));
  rows.push(foot('NG / Total sample', (d) => {
    const p = aqlLookup(DEFAULT_PLAN, d.cat, d.qty);
    return `<span class="mono" style="color:${d.ng ? 'var(--ng)' : 'inherit'}">${d.ng}</span> / ${p ? p.n : '–'}`;
  }));
  rows.push(foot('Judgment **)', (d) => (d.j ? `<span class="mark ${d.j}" title="${d.note ? esc(d.note) : ''}">${MARK[d.j]}</span>` : '<span class="subtle">—</span>')));
  rows.push(foot('QF No.', (d) => esc(d.qf || '—')));
  rows.push(foot('Inspected by', () => `<span class="signer"><span class="avatar sm" style="background:${INSPECTOR.avatar}">${INSPECTOR.initials}</span>${INSPECTOR.name}</span>`));
  rows.push(foot('Checked by', () => '<span class="subtle" style="font-weight:500">Waiting</span>'));
  document.getElementById('sheet-body').innerHTML = rows.join('');

  document.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openDelivery(+b.dataset.edit)));
  document.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => openDelivery(DELIVERIES.length)));
}

/* ---------- Delivery modal ---------- */
let draft = null;
let draftIndex = 0;
let step = 1;

function openDelivery(index) {
  draftIndex = index;
  const existing = DELIVERIES[index];
  draft = existing
    ? JSON.parse(JSON.stringify(existing))
    : { po: '', date: '2026-10-01', qty: '', cat: 'N', actual: LINES.map(() => ''), visual: VISUAL.map(() => 'OK'), fitting: FITTING.map(() => 'OK'), ng: 0, j: null, note: '', qf: '' };

  document.getElementById('dlv-title').textContent = `Delivery ${index + 1}${existing ? '' : ' · new'}`;
  document.getElementById('d-po').value = draft.po;
  document.getElementById('d-date').value = draft.date;
  document.getElementById('d-qty').value = draft.qty;
  document.getElementById('d-ng').value = draft.ng;
  document.getElementById('d-note').value = draft.note;
  document.getElementById('d-qf').value = draft.qf;
  buildMeasure();
  goStep(1);
  openModal('m-delivery');
}

function goStep(n) {
  step = n;
  document.querySelectorAll('.steps .step').forEach((s) => {
    const k = +s.dataset.step;
    s.classList.toggle('on', k === n);
    s.classList.toggle('done', k < n);
  });
  document.querySelectorAll('[data-panel]').forEach((p) => p.classList.toggle('on', +p.dataset.panel === n));
  document.getElementById('d-back').style.visibility = n === 1 ? 'hidden' : 'visible';
  document.getElementById('d-next').innerHTML = n === 3 ? '<span class="icon">save</span>Save delivery' : 'Next<span class="icon">arrow_forward</span>';
  if (n === 1) refreshAql();
  if (n === 3) refreshResult(true);
  const first = document.querySelector(`[data-panel="${n}"] input:not([disabled])`);
  if (first) setTimeout(() => first.focus(), 60);
}

function refreshAql() {
  document.querySelectorAll('#d-cat button').forEach((b) => b.classList.toggle('on', b.dataset.cat === draft.cat));
  const p = aqlLookup(DEFAULT_PLAN, draft.cat, draft.qty);
  document.getElementById('d-aql').innerHTML = p
    ? `<span class="icon">table_chart</span><div><b>${p.n}</b><span>Sample (pcs)</span></div><div class="ac"><b>${p.ac}</b><span>Accept ≤</span></div><div class="re"><b>${p.re}</b><span>Reject ≥</span></div>`
    : `<span class="icon">table_chart</span><div style="grid-column: span 3"><span>Enter the QTY received to get the sample size</span></div>`;
  document.getElementById('d-aql-note').textContent = p
    ? p.full
      ? 'The lot is smaller than the sample: inspect every piece (100 %).'
      : `AQL plan "S-1 · zero defects", ${CATEGORIES[draft.cat]}, code letter ${p.letter}.`
    : '';
}

function buildMeasure() {
  const seg = (group, i, value) =>
    `<div class="seg" role="radiogroup"><button type="button" class="ok-btn ${value === 'OK' ? 'on' : ''}" data-g="${group}" data-i="${i}" data-v="OK">OK</button><button type="button" class="ng-btn ${value === 'NG' ? 'on' : ''}" data-g="${group}" data-i="${i}" data-v="NG">NG</button></div>`;
  let html = '';
  LINES.forEach((l, i) => {
    const r = judge(l, draft.actual[i]);
    html += `<tr><td class="subtle">${i + 1}</td><td><b>${l.item}</b></td><td class="num">${l.std}</td><td class="num tol-col">${l.tol}</td>
      <td><input class="input actual ${r === 'NG' ? 'ng' : ''}" data-i="${i}" inputmode="decimal" value="${esc(draft.actual[i])}" aria-label="Actual for ${l.item}" /></td><td id="m-res-${i}">${pill(r)}</td></tr>`;
  });
  html += `<tr class="sec"><td colspan="6">Certificate No</td></tr>`;
  html += HAS_COA
    ? `<tr><td></td><td><b>COA NO.</b></td><td colspan="2" class="tol-col"></td><td><input class="input" placeholder="COA number" /></td><td>${seg('coa', 0, 'OK')}</td></tr>`
    : `<tr><td></td><td colspan="5" class="subtle">No certificate required for this part.</td></tr>`;
  html += `<tr class="sec"><td colspan="6">Visual</td></tr>`;
  VISUAL.forEach((v, i) => (html += `<tr><td></td><td colspan="3"><b>${v}</b></td><td></td><td>${seg('visual', i, draft.visual[i])}</td></tr>`));
  html += `<tr class="sec"><td colspan="6">Fitting</td></tr>`;
  FITTING.forEach((f, i) => (html += `<tr><td></td><td><b>${f.item}</b></td><td class="num">${f.std}</td><td class="tol-col">${f.tol}</td><td></td><td>${seg('fitting', i, draft.fitting[i])}</td></tr>`));
  document.getElementById('d-measure').innerHTML = html;

  document.querySelectorAll('#d-measure .actual').forEach((inp) => {
    inp.addEventListener('input', () => {
      const i = +inp.dataset.i;
      draft.actual[i] = inp.value;
      const r = judge(LINES[i], inp.value);
      inp.classList.toggle('ng', r === 'NG');
      document.getElementById(`m-res-${i}`).innerHTML = pill(r);
    });
    inp.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const next = document.querySelector(`#d-measure .actual[data-i="${+inp.dataset.i + 1}"]`);
      if (next) next.focus();
      else document.getElementById('d-next').focus();
    });
  });
  document.querySelectorAll('#d-measure .seg button').forEach((b) =>
    b.addEventListener('click', () => {
      if (b.dataset.g !== 'coa') draft[b.dataset.g][+b.dataset.i] = b.dataset.v;
      b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    }),
  );
}

function refreshResult(entering) {
  const p = aqlLookup(DEFAULT_PLAN, draft.cat, draft.qty);
  const ngIn = document.getElementById('d-ng');
  const fromGrid = gridNg(draft);
  if (entering && fromGrid > 0 && !(Number(ngIn.value) >= 1)) ngIn.value = 1;
  draft.ng = Math.max(0, parseInt(ngIn.value, 10) || 0);

  document.getElementById('d-of').textContent = `/ ${p ? p.n : '–'}`;
  document.getElementById('d-ng-hint').textContent = fromGrid
    ? `Step 2 has ${fromGrid} NG value${fromGrid > 1 ? 's' : ''}, so at least 1 piece is defective. Count pieces, not values.`
    : 'All values in step 2 are OK.';
  if (fromGrid > 0 && draft.ng < 1) {
    draft.ng = 1;
    ngIn.value = 1;
  }

  const suggest = p ? (draft.ng <= p.ac ? 'o' : 'x') : null;
  const box = document.getElementById('d-suggest');
  box.className = 'suggestion ' + (suggest || '');
  box.innerHTML = suggest === 'o'
    ? `<span class="icon">check_circle</span>Suggested: Accept — ${draft.ng} defective ≤ Ac ${p.ac}`
    : suggest === 'x'
      ? `<span class="icon">cancel</span>Suggested: Reject — ${draft.ng} defective ≥ Re ${p.re}`
      : '';

  const [o, , c] = document.querySelectorAll('#d-judg button');
  o.disabled = !p || draft.ng > p.ac;
  c.disabled = !p || draft.ng < p.re;
  if ((draft.j === 'o' && o.disabled) || (draft.j === 'c' && c.disabled)) draft.j = null;
  if (entering && !draft.j && suggest) draft.j = suggest;
  document.querySelectorAll('#d-judg button').forEach((b) => b.classList.toggle('on', b.dataset.j === draft.j));
  document.getElementById('d-note-field').classList.toggle('hidden', draft.j !== 'c');
}

function saveDelivery() {
  draft.po = document.getElementById('d-po').value.trim();
  draft.date = document.getElementById('d-date').value;
  draft.note = document.getElementById('d-note').value.trim();
  draft.qf = document.getElementById('d-qf').value.trim();
  if (draft.j === 'c' && !draft.note) {
    document.getElementById('d-note').focus();
    document.getElementById('d-note').style.borderColor = 'var(--ng)';
    return;
  }
  draft.qty = Number(draft.qty);
  DELIVERIES[draftIndex] = draft;
  closeModal();
  renderSheet();
  toast(`Delivery ${draftIndex + 1} saved`);
}

document.getElementById('d-po').addEventListener('input', (e) => (draft.po = e.target.value));
document.getElementById('d-qty').addEventListener('input', (e) => {
  draft.qty = e.target.value.replace(/\D/g, '');
  e.target.value = draft.qty;
  refreshAql();
});
document.querySelectorAll('#d-cat button').forEach((b) =>
  b.addEventListener('click', () => {
    draft.cat = b.dataset.cat;
    refreshAql();
  }),
);
document.getElementById('d-ng').addEventListener('input', () => refreshResult(false));
document.querySelectorAll('#d-judg button').forEach((b) =>
  b.addEventListener('click', () => {
    if (b.disabled) return;
    draft.j = b.dataset.j;
    refreshResult(false);
  }),
);
document.getElementById('d-back').addEventListener('click', () => goStep(step - 1));
document.getElementById('d-next').addEventListener('click', () => {
  if (step === 1) {
    const qty = document.getElementById('d-qty');
    const po = document.getElementById('d-po');
    if (!po.value.trim()) return po.focus();
    if (!aqlLookup(DEFAULT_PLAN, draft.cat, draft.qty)) return qty.focus();
  }
  if (step < 3) goStep(step + 1);
  else saveDelivery();
});
document.getElementById('d-note').addEventListener('input', (e) => (e.target.style.borderColor = ''));

/* ---------- Page actions ---------- */
document.getElementById('add-delivery').addEventListener('click', () => openDelivery(DELIVERIES.length));
document.getElementById('submit-btn').addEventListener('click', () => {
  const unjudged = DELIVERIES.filter((d) => !d.j).length;
  document.getElementById('submit-sub').textContent = `${DELIVERIES.length} deliveries${unjudged ? ` · ${unjudged} without judgment` : ''} · ${document.getElementById('insp-no').textContent}`;
  openModal('m-submit');
});
document.getElementById('submit-confirm').addEventListener('click', () => {
  closeModal();
  toast('Submitted for check');
});
document.getElementById('details-form').addEventListener('submit', (e) => {
  e.preventDefault();
  document.getElementById('kv-inst').textContent = document.getElementById('e-inst').value;
  closeModal();
  renderSheet();
  toast('Details saved');
});

renderSheet();
if (isNew) {
  toast('INS-000129 created · add the first delivery');
}
