// aql-page.js — the AQL table page: plan cards, N/T/R tabs, lot-size calculator, edit-rows modal.
let plan = DEFAULT_PLAN;
let cat = 'N';

function renderAqlPage() {
  document.getElementById('plan-cards').innerHTML = Object.entries(AQL_PLANS)
    .map(
      ([k, p]) =>
        `<button type="button" class="plan-card ${k === plan ? 'on' : ''}" data-plan="${k}"><span class="row1"><b>${p.name}</b><span class="chip ${k === DEFAULT_PLAN ? 'chip-brand' : 'chip-neutral'}">${p.badge}</span></span><span>${p.sub}</span></button>`,
    )
    .join('');
  document.querySelectorAll('.plan-card').forEach((b) =>
    b.addEventListener('click', () => {
      plan = b.dataset.plan;
      renderAqlPage();
    }),
  );
  document.querySelectorAll('#cat-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.cat === cat));
  document.getElementById('calc-cat').value = cat;
  document.getElementById('plan-title').textContent = AQL_PLANS[plan].name;

  const lot = document.getElementById('calc-lot').value;
  const hit = aqlLookup(plan, cat, lot);
  const rows = AQL_PLANS[plan].rows[cat];
  document.getElementById('plan-table').innerHTML = rows
    ? `<table class="data"><thead><tr><th>Lot size</th><th>Code</th><th>Sample size</th><th>Accept (Ac)</th><th>Reject (Re)</th></tr></thead><tbody>${rows
        .map(
          (r) =>
            `<tr class="${hit && hit.row === r ? 'hit' : ''}"><td class="mono cell-strong">${fmtLot(r[0], r[1])}</td><td><span class="letter">${r[2]}</span></td><td class="mono">${r[3]} pcs</td><td><span class="chip chip-ok">${r[4]}</span></td><td><span class="chip chip-ng">${r[5]}</span></td></tr>`,
        )
        .join('')}</tbody></table>`
    : `<div class="empty"><span class="icon">table_rows</span>${CATEGORIES[cat]} rows for this plan aren't entered yet.<br />Fill them from the official ISO 2859-1 tables with <b>Edit rows</b>.</div>`;

  document.getElementById('calc-result').innerHTML = hit
    ? `<div><b>${hit.n}</b><span>Sample (pcs)</span></div><div class="ac"><b>${hit.ac}</b><span>Accept ≤</span></div><div class="re"><b>${hit.re}</b><span>Reject ≥</span></div>`
    : `<div style="grid-column: 1 / -1"><span>No plan for this lot size and category</span></div>`;
  document.getElementById('calc-note').textContent = hit
    ? hit.full
      ? 'The lot is smaller than the sample: inspect every piece (100 %).'
      : `Code letter ${hit.letter}. Accept the delivery with up to ${hit.ac} defective piece${hit.ac === 1 ? '' : 's'}; reject from ${hit.re}.`
    : '';
}

function openEditRows() {
  const rows = AQL_PLANS[plan].rows[cat] || [[1, null, '', '', '', '']];
  document.getElementById('edit-sub').textContent = `${AQL_PLANS[plan].name} · ${CATEGORIES[cat]}`;
  document.getElementById('edit-body').innerHTML = rows
    .map(
      (r) =>
        `<tr><td><input class="input mono" value="${r[0]}" aria-label="Lot from" /></td><td><input class="input mono" value="${r[1] ?? ''}" placeholder="∞" aria-label="Lot to" /></td><td><input class="input" value="${r[2]}" aria-label="Code letter" /></td><td><input class="input mono" value="${r[3]}" aria-label="Sample size" /></td><td><input class="input mono" value="${r[4]}" aria-label="Accept" /></td><td><input class="input mono" value="${r[5]}" aria-label="Reject" /></td></tr>`,
    )
    .join('');
  openModal('m-edit');
}

document.querySelectorAll('#cat-tabs button').forEach((b) =>
  b.addEventListener('click', () => {
    cat = b.dataset.cat;
    renderAqlPage();
  }),
);
document.getElementById('calc-lot').addEventListener('input', renderAqlPage);
document.getElementById('calc-cat').addEventListener('change', (e) => {
  cat = e.target.value;
  renderAqlPage();
});
document.getElementById('edit-rows').addEventListener('click', openEditRows);
document.getElementById('edit-save').addEventListener('click', () => {
  closeModal();
  toast('AQL rows saved');
});

renderAqlPage();
