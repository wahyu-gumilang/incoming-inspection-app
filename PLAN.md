# PLAN.md — Incoming Inspection QC System Roadmap

Status: `[ ]` todo · `[~]` in progress · `[x]` done
Last updated: 2026-09-30

## 1. Goal

A web app for the Quality team of **PT. Chubb Safes Indonesia** to record, evaluate and
store the inspection of materials and parts received from suppliers, replacing the paper
**Form No 7.4.3-F1 "Incoming Inspection Check List"** (`docs/chek sheet-qhse.pdf`).

1. Pick an item and a supplier; the item's QC standards load automatically.
2. Enter up to 7 delivery columns (P/O, delivery date, qty, inspection category) and the actual measurements.
3. Get OK/NG per value in real time and an NG count per delivery.
4. Decide Accepted / Rejected / Concession per delivery, sign off (*Inspected by*, *Checked by*).
5. Print the result in the 7.4.3-F1 layout as PDF.

**Stack:** Node.js · Express 5 · MariaDB 10.4 `csi_db` (`mysql2/promise`) · Puppeteer (PDF) · Angular (latest) + Angular Material.

**Repository layout:** `backend/`, `frontend/`, `docs/` (see `CLAUDE.md`).

## 2. Current state

- [x] Express 5 server: CORS, JSON body parsing, 404 and 500 handlers, in `backend/` (`app.js` + `server.js`)
- [x] `GET /api/health` with DB connectivity check
- [x] `config/db.js`: pool with WSL2 host auto-detection, `dateStrings`, `decimalNumbers`
- [x] `csi_db` imported with existing data
- [x] Reference files copied to `docs/`: `csi_db.sql`, `chek sheet-qhse.pdf`, `chek sheet-qhse (cara isi).pdf`
- [x] `CLAUDE.md` and `PLAN.md` rewritten for the `backend/` + `frontend/` layout and the 7.4.3-F1 workflow
- [x] Git: initial commit on `main`, pushed to `origin/main`

## 3. Data model (confirmed from `docs/csi_db.sql`, 2026-09-28 dump)

```
inventtable 1───* inventinspectitem              (itemid; standards per item)
     │ itemid
     ▼
inspecttable *───1 vendtable                     (inspecttable.accountnum = vendtable.vendaccount)
     │ inspectnum
     ├──* inspectline        STD lines, actual_1..7 / status_1..7
     └──* inspectlineother   VISUAL / FITTING / CERTIFIKAT lines
inspectsetup                                      list of "Checked by" names
```

| Table | Rows | Columns | Notes |
|---|---|---|---|
| `inventtable` | 1 685 | `itemid`, `name`, `inspectqty` | No PK. Meaning of `inspectqty` unknown (Q4). |
| `inventinspectitem` | ~11 900 | `itemid`, `itemname`, `inspecttype`, `inspectitem`, `standard_txt`, `standard` (dec 18,2), `tolerance` (text), `tolerance_plus`, `tolerance_minus` (dec 19,2) | PK (`itemid`,`inspecttype`,`inspectitem`). Types: `STD` 10 366, `VISUAL` 993, `FITTING` 343, `CERTIFIKAT` 191, some with a trailing space. Up to 28 `STD` lines per item. |
| `vendtable` | **0** | `vendaccount`, `name` | No PK. Empty: vendors must be loaded (Q2). |
| `inspecttable` | 2 (test data) | `inspectnum` (PK, `INS-000001`), `inspectdate`, `itemid`, `itemname`, `accountnum`, `name`, `inspectstatus` (varchar), `purchordernum1..7`, `deliverydate1..7` (default today), `qty_received1..7`, `inspectcategory1..7` (int), `notgood1..7` (int), `judgment1..7` (int), `qfnum`, `inspectby`, `checkedby`, `recid` | One row = one form = up to 7 delivery columns. |
| `inspectline` | 0 | `inspectnum`, `linenum` (PK together), `inspectitem`, `standard`, `tolerance` (single dec), `actual_1..7`, `status_1..7` (int, default 0) | Column N ↔ delivery column N. |
| `inspectlineother` | 0 | `inspectnum`, `linenum`, `inspecttype`, `inspectitem` | No PK and **no result columns** yet. |
| `inspectsetup` | 0 | `id`, `checkedby` | No PK. |
| `numseqtable` | 1 | `processid`, `processname`, `formatstring`, `length_tag`, `nextid` | Number sequences (currently only `Sales Order`). |
| `oauth_*`, `password_reset_temp`, `orders` | — | — | Owned by another system. Not used until §5 auth. Never exposed or modified. |

### Gaps between the paper form and the schema

| Form 7.4.3-F1 field | In schema? | Plan |
|---|---|---|
| Actual + OK/NG per STD line per delivery | `inspectline.actual_N`, `status_N` | Make nullable (migration 002) |
| Asymmetric tolerance (`+0.3/-0`), `Min`, `Max`, display texts | Only `inspectline.tolerance` (one decimal) | Add snapshot columns (migration 003) |
| Visual / Fitting / Certificate result per delivery | `inspectlineother` has no result columns | Add `actual_txt_N`, `status_N` (migration 004) |
| Measuring Instrument (one row for the whole form) | Missing | Add `inspecttable.instrument` (migration 005) |
| NG / **Total sample** per delivery | `notgoodN` only | Q5, add `totalsampleN` if confirmed |
| QF No., Inspected by, Checked by **per delivery column** | Single `qfnum`, `inspectby`, `checkedby` | Q6; default: one value per form, printed in every used column |
| Remarks, approval timestamps | Missing | Phase 4 migration |

### Code maps (proposed, confirm with QC — Q1)

| Column | Values |
|---|---|
| `inspectcategoryN` | `0` = no mark (100 % inspection), `1` = N Normal, `2` = R Reduce, `3` = T Tightening |
| `judgmentN` | `0` = not judged, `1` = O Accepted, `2` = X Rejected, `3` = C Concession |
| `status_N` | `NULL` = not measured, `1` = OK, `0` = NG |
| `inspectstatus` | `DRAFT`, `SUBMITTED`, `CHECKED` (legacy `'1'` rows shown as-is, read-only) |

### Judgement rule (from the spec; edge cases to confirm — Q3)

- `STD` value: OK when `standard − tolerance_minus ≤ actual ≤ standard + tolerance_plus`.
- Tolerance text `Min` → OK when `actual ≥ standard`; `Max` → OK when `actual ≤ standard`.
- Qualitative lines: OK/NG chosen by the inspector.
- `notgoodN` = count of NG values in column N across all lines. `judgmentN = Accepted` is refused when `notgoodN > 0`.
- Data quality in the master (reported by the Phase 1 check script, not fixed silently):
  ~700 `STD` rows with tolerance text `' 0.0'` and both limits `0` (exact match? reference dimension?),
  STD rows whose tolerance text is qualitative (`Tidak Terangkat`, `Fitting OK`), and at least one
  negative `tolerance_minus` (`1-1-29-04` / C: `-0.5/-0` stored as `-5.00`).

---

## Phase 1 — Foundation: Setup & Database

Goal: both projects run, tooling is in place, and the schema can store everything the form needs.

### 1.1 Repository restructure
- [x] Move `server.js`, `config/`, `package.json`, `package-lock.json`, `.env.example` into `backend/` (with `git mv`); fix paths; `npm run dev` still works from `backend/`
- [x] Root `.gitignore` covers `node_modules/`, `.env`, `.env.test`, `docs/csi_db.sql`, generated PDFs, `frontend/dist/`
- [x] Split `server.js` into `app.js` (the Express app) and `server.js` (listen), so tests can load the app

### 1.2 Backend plumbing
- [ ] `routes/index.js` mounted at `/api`; `/api/health` moved to the standard shape (`{ success, data: { status, db, timestamp } }`)
- [ ] `utils/app-error.js`, `utils/response.js` (`ok`, `created`), `utils/pagination.js`
- [ ] `middlewares/error-handler.middleware.js` and `not-found.middleware.js` returning the JSON error shape (replaces the current `{ message }` handlers)
- [ ] `middlewares/validate.middleware.js` + Zod
- [ ] `constants/inspection.js`: column lists for `_1..7`, inspect types, the code maps from §3
- [ ] ESLint (flat config), Prettier, Jest, Supertest; `npm run lint`, `npm test`, `npm run format`

### 1.3 Database
- [ ] `scripts/dump-schema.js` + `npm run db:schema` → `docs/schema.sql` (schema only, no data). Commit it.
- [ ] `scripts/migrate.js` + `npm run db:migrate`: applies `db/migrations/NNN_*.sql` in order and records them in a `schema_migrations` table
- [ ] `scripts/check-data.js`: reports duplicate keys, trailing-space `inspecttype`, zero/negative tolerances, qualitative STD rows (§3). Output reviewed with QC.
- [ ] Migrations (each checks its preconditions first):
  - [ ] `001_add_primary_keys.sql`: `inventtable(itemid)`, `vendtable(vendaccount)`, `inspectsetup(id)` AUTO_INCREMENT, `inspectlineother(inspectnum, linenum)`
  - [ ] `002_inspectline_nullable_results.sql`: `actual_1..7`, `status_1..7` → `NULL DEFAULT NULL` (table is empty, so no data changes)
  - [ ] `003_inspectline_snapshot.sql`: add `inspecttype`, `standard_txt`, `tolerance_txt`, `tolerance_plus`, `tolerance_minus`
  - [ ] `004_inspectlineother_results.sql`: add `standard_txt`, `actual_txt_1..7`, `status_1..7`
  - [ ] `005_inspecttable_instrument.sql`: add `instrument`; indexes on `inspectdate`, `itemid`, `accountnum`
  - [ ] Inspection number sequence: a `numseqtable` row for incoming inspection (`INS-`, length 6, continuing after the highest existing `inspectnum`), or a dedicated table if Q7 says `numseqtable` is off-limits
- [ ] Test database `csi_db_test` built from `docs/schema.sql` + migrations + small seed fixtures (no real data); `.env.test` (git-ignored) and `.env.test.example`

### 1.4 Frontend scaffold
- [ ] `npx @angular/cli@latest new frontend` (standalone, routing, SCSS, strict); Angular Material; angular-eslint; Prettier
- [ ] `proxy.conf.json` sends `/api` to `http://localhost:5000`; API base URL from `environments/`
- [ ] App shell: sidebar (Inspections, Master Data: Items, Vendors, Checkers) and top bar with the company name

**Phase 1 done when:** `npm run lint && npm test` pass in `backend/` and `frontend/`, `npm run db:migrate` applies cleanly on a fresh copy of `csi_db`, and `/api/health` answers in the new shape.

---

## Phase 2 — Backend API & OK/NG Logic

Goal: the whole inspection can be created, measured and judged through the API alone.

### 2.1 Judgement engine (`services/judgement.js`, pure functions)
- [ ] `judgeValue(line, actual)` → `1 | 0 | null` (range, `Min`, `Max`, empty)
- [ ] `judgeLines(lines)` → `status_N` for every line and column
- [ ] `countNotGood(lines, otherLines)` → `notgood1..7`
- [ ] `validateJudgments(header)`: `Accepted` not allowed with NG; used column without judgment blocks submit
- [ ] Integer-hundredths arithmetic
- [ ] Unit tests: exactly on each limit, 0.01 outside, `+x/-0` and `+0/-x`, `Min`/`Max`, zero tolerance, empty values, negative standard, qualitative lines, all 7 columns

### 2.2 Master data API (read-heavy; the item data already exists)
| Method | Path | Description |
|---|---|---|
| GET | `/api/items` | List with `page`, `limit`, `sort`, `order`, `q` (itemid/name) |
| GET | `/api/items/lookup?q=` | `{ itemid, name }` for autocomplete (Part no / Part name) |
| GET | `/api/items/:itemId` | Item with `inspectItems[]` grouped by normalized `inspecttype` |
| GET | `/api/items/:itemId/inspect-items` | Standards ordered by type (`STD` → `CERTIFIKAT` → `VISUAL` → `FITTING`) then `inspectitem` |
| POST / PUT / DELETE | `/api/items/:itemId/inspect-items[/...]` | Maintain standards (validation: numeric `standard`, `tolerance_plus/minus ≥ 0`, unique key) |
| GET / POST / PUT / DELETE | `/api/vendors[/:vendaccount]` | Vendor CRUD; `409` on duplicate, `409` on delete when referenced by `inspecttable.accountnum` |
| POST | `/api/vendors/import` | Bulk load from CSV (vendor table is empty, Q2) |
| GET | `/api/vendors/lookup?q=` | `{ vendaccount, name }` |
| GET / POST / DELETE | `/api/setup/checkers` | `inspectsetup` names for the *Checked by* dropdown |

- [ ] Repository, service, controller, routes and validator files for items, inspect items, vendors, checkers
- [ ] Integration tests: paging/search/sort whitelist, 404s, duplicates, delete-in-use

### 2.3 Inspection API
| Method | Path | Description |
|---|---|---|
| GET | `/api/inspections` | List. Filters: `dateFrom`, `dateTo` (`inspectdate`), `item`, `vendor`, `status`, `judgment`, `q` (inspectnum / P/O) |
| GET | `/api/inspections/template?itemId=` | Empty header + `lines[]` / `otherLines[]` snapshotted from `inventinspectitem` |
| GET | `/api/inspections/:inspectnum` | Header + `lines[]` + `otherLines[]` + computed `columns[]` (used flag, `totalReceived`) |
| POST | `/api/inspections` | Create header + lines in **one transaction**; server assigns `inspectnum`, computes `status_N` and `notgoodN`; `201` |
| PUT | `/api/inspections/:inspectnum` | Replace header + lines in one transaction (only in `DRAFT`) |
| PATCH | `/api/inspections/:inspectnum/columns/:n` | Save one delivery column (header fields + that column's actuals) for autosave |
| DELETE | `/api/inspections/:inspectnum` | Only in `DRAFT`; `204` |

Business rules (`services/inspection.service.js`):
- [ ] `inspectnum` generated on the server, unique under concurrent saves (`SELECT … FOR UPDATE` on the sequence row)
- [ ] Item and vendor must exist (`422`); `itemname` / `name` copied into the header at save time
- [ ] Delivery columns: used columns are consecutive from 1; a used column needs P/O, delivery date, qty > 0 and a category; unused columns are stored empty (`NULL` P/O, qty `0`), their dates ignored
- [ ] Line snapshot from the master on create; later master edits don't touch saved inspections
- [ ] `status_N` and `notgoodN` always recomputed by the server; client-sent values are ignored
- [ ] Wrong status for an action → `409 INVALID_STATUS`
- [ ] Integration tests: create from template, rollback when one line fails, update blocked outside `DRAFT`, number uniqueness under parallel creates, filters

**Phase 2 done when:** an inspection for a real item (e.g. `000-228`) can be created from the template, measured in several delivery columns and read back with correct OK/NG and NG counts, using only `curl`.

---

## Phase 3 — Frontend: Inspection UI & Validation

Goal: a QC inspector can fill the whole check sheet in the browser as fast as on paper.

### 3.1 Core
- [ ] `core/ApiService` unwrapping `{ success, data, meta }`; error interceptor → snackbar with `error.message`, field errors mapped from `error.details[]`
- [ ] `core/models/`: interfaces with the exact API field names; code maps mirrored from `backend/constants/`
- [ ] `shared/judgement.ts`: the same OK/NG rules as `judgement.js`, with a shared test-case table (JSON fixture used by both test suites)
- [ ] Shared components: server-side data table, lookup autocomplete, OK/NG badge, confirm dialog, loading indicator

### 3.2 Master data screens
- [ ] Items: list + detail with the standards grid (grouped STD / Certificate / Visual / Fitting), edit standards
- [ ] Vendors: list, create/edit form, CSV import
- [ ] Checkers (`inspectsetup`): simple list editor

### 3.3 Inspection form (mirrors Form 7.4.3-F1)
- [ ] **Header:** Part name / Part no (item lookup), Supplier (vendor lookup), inspect date, measuring instrument
- [ ] Choosing the item loads `/api/inspections/template` and fills the lines; changing the item on a filled form asks for confirmation
- [ ] **Grid:** rows = `STD` lines (No, Item, Standard, Tolerance), then Certificate No, Visual, Fitting; columns = 7 delivery columns of `Actual | OK/NG`
  - Numeric input with 2 decimals; OK/NG cell updates as you type, NG highlighted red
  - Qualitative rows: OK/NG toggle; Certificate row: COA number text + OK/NG
  - Keyboard: Enter moves down within a column (the way QC measures one delivery), Tab moves right
- [ ] **Footer rows per column:** P/O No, Delivery date, QTY received / Insp. category (N / R / T / 100 %), NG / Total sample (computed), Judgment (O / X / C), QF No
- [ ] Validation mirrors the server: unused columns disabled until the previous one is used, required fields per used column, `Accepted` disabled when the column has NG
- [ ] Save draft (and autosave per column), unsaved-changes guard, server values replace local ones after each save
- [ ] Inspection list: filters (date range, item, supplier, status, judgment), paging, row actions (open, PDF)
- [ ] Read-only view for inspections outside `DRAFT`

### 3.4 Frontend quality
- [ ] Unit tests: services, `judgement.ts` (shared fixture), form validators
- [ ] Component test for the grid: typing an out-of-tolerance value marks NG and increments NG / Total sample
- [ ] Responsive enough for a tablet on the receiving floor (landscape)

**Phase 3 done when:** an inspector can create, fill and save an inspection matching the filled example in `docs/chek sheet-qhse (cara isi).pdf`, with OK/NG identical to the server's result.

---

## Phase 4 — Reporting (PDF) & Approval Workflow

Goal: the inspection is signed off and prints as the official check sheet.

### 4.1 Approval workflow
- [ ] Migration `006_inspecttable_approval.sql`: `submitted_at`, `checked_at`, `return_reason`, `remarks` (only the columns Q6 leaves missing)
- [ ] Status flow `DRAFT → SUBMITTED → CHECKED`, and `SUBMITTED → DRAFT` (returned with a reason)
- [ ] `POST /api/inspections/:inspectnum/submit`: needs `inspectby`, all used columns judged; recomputes OK/NG; locks editing
- [ ] `POST /api/inspections/:inspectnum/check`: `checkedby` must be a name from `inspectsetup`; final
- [ ] `POST /api/inspections/:inspectnum/return`: `reason` required
- [ ] Until auth exists (§5), names are chosen in the form; the API records them as sent
- [ ] UI: Submit / Check / Return buttons shown only in the right status; status badge on list and form
- [ ] Tests: full flow, every wrong-status action returns `409`, `Accepted` with NG returns `422`

### 4.2 PDF report (Form 7.4.3-F1)
- [ ] Engine: Puppeteer + EJS template behind `reports/engine.js` → `renderInspectionPdf(inspection)`, so it can be swapped for PDFKit if the server can't run Chromium. Spike on WSL2 first.
- [ ] `reports/templates/inspection-check-list.ejs` copying `docs/chek sheet-qhse.pdf`:
  - Title block: *Form No : 7.4.3-F1*, *INCOMING INSPECTION CHECK LIST*, *PT. Chubb Safes Indonesia*, Rev / Tanggal / Hal. boxes (form revision from config)
  - Part name, Part no., Supplier name
  - Dimensions table (No, Item, Standard, Tolerance) + 7 × (Actual, OK/NG), grey Actual cells as on the form
  - Certificate No, Visual, Fitting rows
  - Footer rows: P/O No, Delivery date, Measuring Instrument, QTY received / Insp. Category, NG / Total sample, Judgment, QF No, Inspected by, Checked by
  - Legend: `*) T: Tightening N: Normal R: Reduce` · `**) O: Accepted X: Rejected C: Concession No Mark: 100 % inspection`
- [ ] A4 landscape; more than 13 STD lines continue on the next page with repeated headers; "Hal. X/Y"
- [ ] NG values marked; `DRAFT` / `SUBMITTED` inspections get a watermark, only `CHECKED` prints clean
- [ ] `services/report.service.js` reuses the inspection repository; one shared browser instance, limited concurrent renders, render timeout, browser closed on shutdown
- [ ] `GET /api/reports/inspections/:inspectnum/pdf` (`inline`; `?download=1` for attachment; filename `<inspectnum>.pdf`)
- [ ] `GET /api/reports/inspections/:inspectnum/html` preview (dev only)
- [ ] Frontend: PDF viewer dialog (iframe of the blob URL), download and print buttons, opened from the list and the form
- [ ] Tests: `application/pdf` + filename header, `404` for unknown id, HTML snapshot of the template

### 4.3 Release checklist
- [ ] Playwright E2E: create vendor → pick item → fill 2 delivery columns with one NG → judge → submit → check → open PDF
- [ ] QC walks through the app with the paper form side by side and signs off the layout

**Phase 4 done when:** a checked inspection opens as a correctly paginated 7.4.3-F1 PDF in under about 3 seconds, and QC accepts it as a replacement for the paper form.

---

## 5. Later (not scheduled)
- Authentication and roles (inspector / checker / viewer), possibly reusing the existing `oauth_users` table
- Dashboard: NG rate per supplier, item and month; Excel export
- Attachments (photos, COA scans) on an inspection
- Audit log of changes
- Deployment: Nginx serving the Angular build and proxying `/api`, PM2 for Node, database backups

## 6. Open questions
1. **Code maps:** are the values in §3 right for `inspectcategoryN`, `judgmentN` and `inspectstatus`? The two existing rows use `1` everywhere and look like test data — may they be deleted?
2. **Vendors:** `vendtable` is empty. Where does the supplier list come from (ERP export, Excel)? Is `vendaccount` a supplier code from another system?
3. **Tolerance edge cases:** how should the ~700 STD standards with tolerance `' 0.0'` and both limits `0` be judged (exact match, or reference only / not judged)? Are qualitative texts in STD rows (`Tidak Terangkat`) really visual checks?
4. What does `inventtable.inspectqty` mean (sample size? AQL?) and should it prefill *Total sample*?
5. **NG / Total sample:** is the total sample entered per delivery column? If so, add `totalsample1..7` (the schema has only `notgood1..7`).
6. **Per-column sign-off:** the form has *QF No*, *Inspected by* and *Checked by* per delivery column, the schema has one each per inspection. Is one per form enough?
7. Is `csi_db` shared with another application (the `oauth_*`, `orders`, `numseqtable` tables suggest so)? May we add a row to `numseqtable` and add keys/columns to the inspection tables?
8. Should the PDF show the form revision as fixed `Rev. 01 / 24/10/23`, or from a setting?
