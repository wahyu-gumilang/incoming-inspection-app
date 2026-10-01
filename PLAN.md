# PLAN.md — Incoming Inspection QC System Roadmap

Status: `[ ]` todo · `[~]` in progress · `[x]` done
Last updated: 2026-10-01

## 1. Goal

A web app for the Quality team of **PT. Chubb Safes Indonesia** to record, evaluate and
store the inspection of materials and parts received from suppliers, replacing the paper
**Form No 7.4.3-F1 "Incoming Inspection Check List"** (`docs/chek sheet-qhse.pdf`).

0. Log in with a username and password; what you can do depends on your role (Inspector, Checker, Admin).
1. Pick an item and a supplier; the item's QC standards load automatically.
2. Enter up to 7 delivery columns (P/O, delivery date, qty, inspection category) and the actual measurements.
3. Get OK/NG per value in real time; the **AQL table** sets each delivery's sample size and accept/reject numbers from its lot size (§2.3).
4. Decide Accepted / Rejected / Concession per delivery; *Inspected by* and *Checked by* come from the logged-in users.
5. Print the result in the 7.4.3-F1 layout as PDF.

**Stack:** Node.js · Express 5 · MariaDB 10.4 `csi_db` (`mysql2/promise`) · Puppeteer (PDF) · Angular 22 + Angular Material.

**Look and feel:** modern and branded (Phase 3.0): Chubbsafes blue `#004F9C` from the logo plus non-clashing accents, light and dark mode, responsive sidebar and dialogs, tables that follow Form 7.4.3-F1.

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
| `inventtable` | 1 685 | `itemid`, `name`, `inspectqty` | PK added (001). `inspectqty` is `0` on every row: unused, ignored (Q4). |
| `inventinspectitem` | ~11 900 | `itemid`, `itemname`, `inspecttype`, `inspectitem`, `standard_txt`, `standard` (dec 18,2), `tolerance` (text), `tolerance_plus`, `tolerance_minus` (dec 19,2) | PK (`itemid`,`inspecttype`,`inspectitem`). Types: `STD` 10 366, `VISUAL` 993, `FITTING` 343, `CERTIFIKAT` 191, some with a trailing space. Up to 28 `STD` lines per item. |
| `vendtable` | **0** | `vendaccount`, `name` | No PK. Empty: dummy vendors will be seeded (Q2 answered). |
| `inspecttable` | 2 (test data) | `inspectnum` (PK, `INS-000001`), `inspectdate`, `itemid`, `itemname`, `accountnum`, `name`, `inspectstatus` (varchar), `purchordernum1..7`, `deliverydate1..7` (default today), `qty_received1..7`, `inspectcategory1..7` (int), `notgood1..7` (int), `judgment1..7` (int), `qfnum`, `inspectby`, `checkedby`, `recid` | One row = one form = up to 7 delivery columns. |
| `inspectline` | 0 | `inspectnum`, `linenum` (PK together), `inspectitem`, `standard`, `tolerance` (single dec), `actual_1..7`, `status_1..7` (int, default 0) | Column N ↔ delivery column N. |
| `inspectlineother` | 0 | `inspectnum`, `linenum`, `inspecttype`, `inspectitem` | No PK and **no result columns** yet. |
| `inspectsetup` | 0 | `id`, `checkedby` | No PK. Superseded by users with the Checker role (§2.0); left in place, unused. |
| `numseqtable` | 1 | `processid`, `processname`, `formatstring`, `length_tag`, `nextid` | Unrelated leftover (`Sales Order`). Not used: the app has its own `inspectnumseq`. |
| `oauth_*`, `password_reset_temp`, `orders` | — | — | Owned by another system. Not used until §5 auth. Never exposed or modified. |

### Gaps between the paper form and the schema

| Form 7.4.3-F1 field | In schema? | Plan |
|---|---|---|
| Actual + OK/NG per STD line per delivery | `inspectline.actual_N`, `status_N` | Make nullable (migration 005) |
| Asymmetric tolerance (`+0.3/-0`), `Min`, `Max`, display texts | Only `inspectline.tolerance` (one decimal) | Add snapshot columns (migration 006) |
| Visual / Fitting / Certificate result per delivery | `inspectlineother` has no result columns | Add `actual_txt_N`, `status_N` (migration 007) |
| Measuring Instrument (one row for the whole form) | Missing | Add `inspecttable.instrument` (migration 008) |
| NG / **Total sample** per delivery | `notgoodN` only | Total sample comes from the AQL plan; snapshot in `samplesize1..7` (migration 012, §2.3) |
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
- `notgoodN` = number of **defective pieces** in delivery N's sample (AQL counts units, not characteristics: one piece with two NG dimensions is 1). The inspector enters it; it can't be `0` while any value in column N is NG.
- AQL (§2.3): from `qty_receivedN` and `inspectcategoryN` the plan gives `samplesizeN`, `acceptnumN` (Ac), `rejectnumN` (Re). The system **suggests** O when `notgoodN ≤ Ac` and X when `notgoodN ≥ Re`. `Accepted` is refused when `notgoodN > Ac`; `Concession` is only allowed when the delivery would be rejected, with a note.
- Data quality in the master, from `npm run db:check` on 2026-10-01 (reported, not fixed silently):
  - 700 `STD` rows with tolerance text `' 0.0'` and both limits `0` (exact match? reference dimension? Q3)
  - 12 `STD` rows whose tolerance is qualitative text (`Tidak Terangkat`)
  - 1 negative `tolerance_minus` (`1-1-29-04` / C: `-0.5/-0` stored as `-5.00`)
  - 9 `STD` rows whose tolerance text disagrees with the numbers, e.g. `1074-253` / A: `±0.3` stored as `+0.3/-1.3`, `3-1-12-05` / B: `+0/-0.1` stored as `+0.1/-0.1` (Q10)
  - 91 `STD` rows where `standard` is about 100 × the printed `standard_txt` (`0.7` → `70`, `0.0012` → `0.12`), probably because `decimal(18,2)` can't hold more than 2 decimals (Q9)
  - `inspecttype` with a trailing space: `'FITTING '` 286 rows, `'VISUAL '` 14 rows

---

## Phase 1 — Foundation: Setup & Database

Goal: both projects run, tooling is in place, and the schema can store everything the form needs.

### 1.1 Repository restructure
- [x] Move `server.js`, `config/`, `package.json`, `package-lock.json`, `.env.example` into `backend/` (with `git mv`); fix paths; `npm run dev` still works from `backend/`
- [x] Root `.gitignore` covers `node_modules/`, `.env`, `.env.test`, `docs/csi_db.sql`, generated PDFs, `frontend/dist/`
- [x] Split `server.js` into `app.js` (the Express app) and `server.js` (listen), so tests can load the app

### 1.2 Backend plumbing
- [x] `routes/index.js` mounted at `/api`; `/api/health` moved to the standard shape (`{ success, data: { status, db, timestamp } }`)
- [x] `utils/app-error.js`, `utils/response.js` (`ok`, `created`, `noContent`), `utils/pagination.js`
- [x] `middlewares/error-handler.middleware.js` and `not-found.middleware.js` returning the JSON error shape (replaces the current `{ message }` handlers)
- [x] `middlewares/validate.middleware.js` + Zod
- [x] `constants/inspection.js`: column lists for `_1..7`, inspect types, the code maps from §3
- [x] ESLint (flat config), Prettier, Jest, Supertest; `npm run lint`, `npm test`, `npm run format`

### 1.3 Database
- [x] `scripts/dump-schema.js` + `npm run db:schema` → `docs/schema.sql` (schema only, no data, unrelated legacy tables excluded)
- [x] `scripts/migrate.js`: `npm run db:migrate` applies `db/migrations/NNN_*.sql` in order and records them in `schema_migrations`; `npm run db:migrate:status` lists pending ones without changing anything
- [x] `scripts/check-data.js` (`npm run db:check`): read-only report of duplicate keys, trailing-space `inspecttype`, tolerance problems, `standard_txt` vs `standard`. Findings in §3, to review with QC.
- [x] `scripts/backup-db.js` (`npm run db:backup`): `mysqldump` of `csi_db` to `DB_BACKUP_DIR`, outside the repo. Backups taken 2026-10-01 at 08:43 and 08:49 (right before migrating).
- [x] `db/baseline.sql`: structure of `csi_db` as imported, the starting point for `csi_db_test`
- [x] Migrations: tested on `csi_db_test`, applied to `csi_db` on 2026-10-01 (row counts unchanged). One `ALTER` per file, because MariaDB can't roll back DDL.
  - [x] `001_inventtable_primary_key.sql`
  - [x] `002_vendtable_primary_key.sql`
  - [x] `003_inspectsetup_primary_key.sql` (`id` becomes AUTO_INCREMENT)
  - [x] `004_inspectlineother_primary_key.sql` (`inspectnum`, `linenum`)
  - [x] `005_inspectline_nullable_results.sql`: `actual_1..7`, `status_1..7` → `NULL DEFAULT NULL`
  - [x] `006_inspectline_snapshot_columns.sql`: `inspecttype`, `standard_txt`, `tolerance_txt`, `tolerance_plus`, `tolerance_minus`
  - [x] `007_inspectlineother_result_columns.sql`: `standard_txt`, `actual_txt_1..7`, `status_1..7`
  - [x] `008_inspecttable_instrument_and_indexes.sql`: `instrument`; indexes on `inspectdate`, `itemid`, `accountnum`
  - [x] `009_create_inspectnumseq.sql`: the app's own number sequence (`INS-`, 6 digits, continuing after the highest existing `inspectnum`; next is `INS-000003`)
- [x] After migrating `csi_db`: `npm run db:schema` and commit `docs/schema.sql`
- [x] Test database `csi_db_test`: `npm run db:test:reset` rebuilds it from `db/baseline.sql` + all migrations + `db/seeds/test-fixtures.sql` (real item ids, dummy vendors/checkers). The `db` Jest project does this before every run. `.env.test` (git-ignored) and `.env.test.example`.

### 1.4 Frontend scaffold
- [x] Angular 22.2 app in `frontend/` (`ng new --routing --style=scss --strict --ssr=false`; zoneless, Vitest); Angular Material; angular-eslint; Prettier with the backend's settings
- [x] Roboto and Material Symbols bundled from npm (`@fontsource/roboto`, `material-symbols`), not Google Fonts, so the app works without internet
- [x] `proxy.conf.json` sends `/api` to `http://localhost:5000`; API base URL from `environments/`
- [x] App shell: top bar (app and company name, API status chip polling `/api/health`), sidebar (Inspections; Master Data: Items, Vendors, Checkers; overlay below 960px), lazy placeholder pages, not-found page, tab titles
- [x] Minimal `core/api/ApiService` (`get`, unwraps `{ success, data }`); completed in Phase 3.1

**Phase 1 done when:** `npm run lint && npm test` pass in `backend/` and `frontend/`, `npm run db:migrate` applies cleanly on a fresh copy of `csi_db`, and `/api/health` answers in the new shape. ✅ Done 2026-10-01.

---

## Phase 2 — Backend API: Auth, Master Data & OK/NG Logic

Goal: users can log in, and the whole inspection can be created, measured and judged through the API alone.

Sections are numbered in working order (renumbered 2026-10-01): 2.4 needs the items, vendors and AQL of 2.2 and 2.3.

### 2.0 Authentication and users
Decisions (2026-10-01): username + password; accounts are created by an Admin (no self-signup, no email server); an Admin resets forgotten passwords. Usernames allow letters, digits, `.`, `_`, `-` (convention: employee NIK).

| Role | Can do |
|---|---|
| `INSPECTOR` | Create and edit own draft inspections, submit them |
| `CHECKER` | Everything an Inspector can, plus check/return submitted inspections (*Checked by*) |
| `ADMIN` | Everything, plus users and master data (items, standards, vendors) |

- [x] Migration `010_create_usertable.sql` (applied to `csi_db` 2026-10-01 16:51 after a backup): `usertable` (`userid` PK auto, `username` unique, `fullname`, `email` NULL, `role`, `password_hash`, `active`, `must_change_password`, `theme` `light|dark|system`, `last_login_at`, `created_at`, `updated_at`)
- [x] Passwords hashed with bcrypt (`bcryptjs`, cost 12); 8–72 characters; never returned by the API
- [x] Session: signed JWT (HS256, user id only) in an `httpOnly`, `SameSite=Strict` cookie `iqc_session` (`Secure` in production), expires after one shift (8 h); role and active flag re-read from the database on every request; `JWT_SECRET` in `.env`, server refuses to start without it
- [x] Login rate limit: 5 failed attempts per username per 15 minutes → `429` (in memory, single process); same `401` for unknown user and wrong password, with equal timing
- [x] Middlewares: `requireAuth` (every `/api` route except `/api/health` and `/api/auth/login`), `requirePasswordChanged` (temporary password → only `/api/auth` until changed, `403 PASSWORD_CHANGE_REQUIRED`), `requireRole(...roles)`; CORS limited to `ALLOWED_ORIGINS`; writes from a foreign `Origin` → `403` (CSRF guard)
- [x] `npm run user:create-admin` script: asks for the password at a hidden prompt (twice), never as an argument
- [x] First Admin on `csi_db`: **Gumilang** (`070203`), created by the owner with the script on 2026-10-01 (verified: ADMIN, active, bcrypt hash)

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | `{ username, password }` → sets the cookie, returns the user; `401` on bad credentials (same message for unknown user and wrong password) |
| POST | `/api/auth/logout` | Clears the cookie; `204` |
| GET | `/api/auth/me` | Current user (`401` when not logged in) |
| PUT | `/api/auth/me` | Update own `fullname`, `email`, `theme` |
| PUT | `/api/auth/me/password` | `{ currentPassword, newPassword }`; clears `must_change_password` |
| GET / POST / PUT | `/api/users[/:userid]` | Admin: list (paging, search, role filter), create, edit role/name/active |
| POST | `/api/users/:userid/reset-password` | Admin: sets a temporary password and `must_change_password` |
| GET | `/api/users/lookup?role=CHECKER` | `{ userid, fullname }` for dropdowns |

- [x] Users are deactivated, never deleted, so names on past inspections stay valid; an Admin can't demote, deactivate or reset themselves
- [x] Tests: login success/failure/rate limit, cookie flags, `401` without cookie, `403` for wrong role, password change, admin reset, inactive user can't log in (115 backend tests)

### 2.1 Judgement engine (`services/judgement.js`, pure functions)
Decided 2026-10-01: STD rules without usable limits (both tolerances 0, or a text such as "Tidak Terangkat"; 712 rows) are **judged by the inspector** like a visual check; a negative tolerance is used by its size; the stored numbers are always used, and doubtful standards are flagged (`services/standard-check.js`) instead of fixed.

- [x] `ruleMode(rule)` → `RANGE | MIN | MAX | MANUAL`; `limits(rule)` in hundredths
- [x] `judgeValue(rule, actual)` → `1 | 0 | null` (range, `Min`, `Max`, empty = not measured, MANUAL = inspector's call); invalid input throws
- [x] `judgeLine(rule, actuals, manual)` → `status_N` for one line over the 7 columns (client statuses ignored except on MANUAL rules)
- [x] `countNgCells(rows, 7)` and `minimumDefects(ngCells)`: `notgoodN` counts pieces, at least 1 when a cell is NG
- [x] `suggestJudgment(defects, plan)` and `judgmentProblems(...)`: Accepted only up to Ac, Concession only from Re with a note
- [x] Integer-hundredths arithmetic (`toHundredths`, string-exact)
- [x] `standardWarnings(row)` → `NO_LIMITS`, `QUALITATIVE_TOLERANCE`, `NEGATIVE_TOLERANCE`, `TOLERANCE_TEXT_MISMATCH`, `STANDARD_TEXT_MISMATCH` (shared with `npm run db:check`)
- [x] Unit tests: exactly on each limit, 0.01 outside, `+x/-0` and `+0/-x`, `Min`/`Max`, zero tolerance, empty values, negative standard, floating-point edge (0.3 ± 0.1), qualitative lines, all 7 columns; plus a run over all 10,375 STD rules in `csi_db` (nominal value OK, ±0.01 beyond each limit NG, no errors)

### 2.2 Master data API
Decided 2026-10-01: items can be added and renamed but not deleted (they come from the company item master); vendors can be deleted while no inspection uses them; 15 dummy vendors for the empty dev `vendtable`.

| Method | Path | Description |
|---|---|---|
| GET | `/api/items` | List with `page`, `limit`, `sort` (`itemid`, `name`), `order`, `q` (part no / name), `hasStandards`; each item has computed `standardCounts` per type and `warningCount` (doubtful standards) |
| GET | `/api/items/lookup?q=` | `{ itemid, name }` for the "Part no." autocomplete (20 max) |
| GET | `/api/items/:itemId` | Item with `inspectItems[]` in form order (STD → CERTIFIKAT → VISUAL → FITTING, items sorted naturally), trimmed texts, computed `mode` and `warnings` |
| POST / PUT | `/api/items[/:itemId]` | Admin: add an item; rename it (the name copied into its standards changes in the same transaction) |
| POST / PUT / DELETE | `/api/items/:itemId/inspect-items` | Admin: add / update / delete a standard, identified by `inspecttype` + `inspectitem` in the body (query for DELETE). Applies to new inspections only |
| GET | `/api/vendors` | List with paging, `sort` (`vendaccount`, `name`, `inspectionCount`), `q`; computed `inspectionCount` |
| GET | `/api/vendors/lookup?q=` · `/api/vendors/:vendaccount` | Autocomplete and one vendor |
| POST / PUT / DELETE | `/api/vendors[/:vendaccount]` | Admin: create (`409` on duplicate), rename, delete (`409 IN_USE` when an inspection uses it) |
| POST | `/api/vendors/import` | Admin: CSV body (`text/csv`, `,` or `;`, optional header, Excel BOM); every row is checked first and nothing is saved if one is invalid; existing accounts are skipped |
| — | `npm run db:seed:dev` | 15 dummy vendors for the development database |

- Reads are open to every signed-in user; writes need `ADMIN`. The *Checked by* list comes from `/api/users/lookup?role=CHECKER` (§2.0).
- Keys with trailing spaces (`'FITTING '`, item ids like `'1-1-02-03 '`) are found by their trimmed value (the collation ignores trailing spaces) and shown trimmed; stored values are never rewritten.
- [x] Repository, service, controller, routes and validator files for items, standards and vendors; `utils/csv.js`
- [x] Integration tests: paging/search/sort whitelist, 404s, duplicates (incl. against a stored trailing space), delete-in-use, CSV import all-or-nothing, Admin-only writes (226 backend tests)
- [x] Checked read-only on `csi_db`: page 1 of 1,685 items in ~36 ms; ids with spaces and trailing spaces resolve
- [x] Dummy vendors loaded into `csi_db` (`npm run db:seed:dev`, 2026-10-01 18:37 after a backup; 15 vendors, re-run adds 0)

### 2.3 AQL sampling (requested by Pak Fajar, 2026-10-01)
The system decides each delivery's sample size and accept/reject numbers from its lot size (`qty_receivedN`) and inspection category (`inspectcategoryN`: N / R / T), using an AQL table admins can view and edit. His Laravel example is the reference for intent only: no new `materials` / `inspections` tables, no random inspection numbers, no free-text inspector.

**Provisional decisions (2026-10-01, to confirm with QC, Q12–Q14):**
| Topic | Decision |
|---|---|
| Sample size | ISO 2859-1 **Special Level S-1**. The filled example matches it exactly: lot 20 and 50 → 2 pcs, lot 100 → 3 pcs |
| Accept / reject | **Ac 0 / Re 1** (zero defects) for the default plan |
| Alternative plan | **ISO General Level II, AQL 2.5** (normal), seeded as a second plan; values to verify against the official standard |
| Tightened / Reduced | Default plan: T = next larger code letter, R = next smaller (min 2 pcs); Ac 0 / Re 1 |
| Lot smaller than the sample | 100 % inspection (`samplesize = lot`) |
| N / R / T | Chosen by the inspector, default N; automatic switching from supplier history is a later feature (§5) |

S-1 code letters (ISO 2859-1 Table 1): 2–50 A (2 pcs), 51–500 B (3), 501–35 000 C (5), 35 001+ D (8). Default plan, normal: 1 → 1 (100 %), 2–50 → 2, 51–500 → 3, 501–35 000 → 5, 35 001+ → 8, all Ac 0 / Re 1.

General Level II, AQL 2.5, normal, arrows already resolved: 2–50 → 5 (0/1), 51–150 → 20 (1/2), 151–280 → 32 (2/3), 281–500 → 50 (3/4), 501–1 200 → 80 (5/6), 1 201–3 200 → 125 (7/8), 3 201–10 000 → 200 (10/11), 10 001–35 000 → 315 (14/15), 35 001+ → 500 (21/22). (Pak Fajar's seeder skipped the ISO arrows for lots 1–8, 26–50 and 51–90 and used 315 above 35 000.)

- [~] Migration `011_create_aql_tables.sql` (tested on `csi_db_test`; waiting for approval for `csi_db`): `aqlplan` (`planid` PK, `name`, `inspectlevel`, `aql`, `isdefault`, `note`, `updated_at`) and `aqlplanrow` (`planid` FK, `inspectcategory` 1/2/3, `lotmin`, `lotmax`, `codeletter`, `samplesize`, `acceptnum`, `rejectnum`; PK `planid, inspectcategory, lotmin`; CHECKs on ranges and Ac < Re), seeded with the two plans above (rows start at lot 2; smaller lots are inspected 100 %)
- [~] Migration `012_inspecttable_aql_columns.sql` (tested on `csi_db_test`; waiting for approval for `csi_db`): `aqlplanid`, `samplesize1..7`, `acceptnum1..7`, `rejectnum1..7`, `concessionnote1..7` (snapshot per delivery, so editing the AQL table never changes saved inspections)
- [x] `services/aql.js` (pure): `findPlanRow(rows, lot, category)` → `{ codeletter, samplesize, acceptnum, rejectnum, fullInspection }` (category 0, a lot below the first range or not bigger than the sample → 100 %); `rowProblems(rows)` for gaps, overlaps, open ranges, Ac/Re. `suggestJudgment` lives in `judgement.js` (§2.1)
- [ ] Recomputed on every save from the server's own tables; values sent by the client are ignored (what the Laravel example called the "security guard") — done with the inspection API (§2.4)
- [x] CSRF: besides the `SameSite=Strict` cookie, state-changing requests must carry an allowed `Origin` header (the equivalent of Laravel's `@csrf`) — done in §2.0

| Method | Path | Description |
|---|---|---|
| GET | `/api/aql/lookup?lot=&category=&planId=` | Real-time sample size / Ac / Re while typing the lot size; `category` uses the `inspectcategory` codes (0 = 100 %, 1 = N, 2 = R, 3 = T); `planId` defaults to the default plan |
| GET | `/api/aql/plans` · `/api/aql/plans/:planId` | Plans (with the categories each covers) and their rows (all logged-in users) |
| PUT | `/api/aql/plans/:planId/rows` | Admin: `{ inspectcategory, rows }` replaces one category's rows in one transaction (`422` with per-row details on gaps / overlaps) |
| PUT | `/api/aql/plans/:planId/default` | Admin: choose the plan new inspections use |

- [x] Tests: every range boundary of both plans, lot below sample size, N/R/T, 100 %, overlapping/gapped rows rejected, Admin-only edits, default switch (269 backend tests)
- [ ] Tests with saved inspections: `Accepted` with `notgoodN > Ac` → `422`, `Concession` without note or below Re → `422`, saved snapshot unchanged after editing a plan — with §2.4

### 2.4 Inspection API
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
- [ ] `inspectby` is set from the logged-in user on create; the client can't choose it
- [ ] Delivery columns: used columns are consecutive from 1; a used column needs P/O, delivery date, qty > 0 and a category; unused columns are stored empty (`NULL` P/O, qty `0`), their dates ignored
- [ ] Line snapshot from the master on create; later master edits don't touch saved inspections
- [ ] `status_N` and `notgoodN` always recomputed by the server; client-sent values are ignored
- [ ] Wrong status for an action → `409 INVALID_STATUS`
- [ ] Integration tests: create from template, rollback when one line fails, update blocked outside `DRAFT`, number uniqueness under parallel creates, filters

**Phase 2 done when:** an inspection for a real item (e.g. `000-228`) can be created from the template, measured in several delivery columns and read back with correct OK/NG, sample sizes and accept/reject numbers, using only `curl`.

---

## Phase 3 — Frontend: UI/UX Foundation, Inspection UI & Validation

Goal: a QC inspector can fill the whole check sheet in the browser as fast as on paper, in a modern, branded UI.

### 3.0 UI/UX foundation (design first, then code)
Agreed direction (2026-10-01): as modern as possible; brand colors from the Chubbsafes logo (`#004F9C` blue, `#1D1D1D` text) with extra accents that don't clash; the logo always sits on a light (or, in dark mode, dark) surface, never on a colored bar; tables follow Form 7.4.3-F1 and may be prettier but must not drift from it.

- [x] **Mockups** in `docs/design/mockups/`, **approved by the owner on 2026-10-01** as the design reference for Phase 3 (open `login.html`). Later design changes stay possible: update the mockup first and add a review note below. One HTML + CSS file per page (`login`, `dashboard`, `inspections`, `inspection-detail`, `items`, `vendors`, `aql`, `users`, `profile`), shared `css/base.css` (tokens), `css/components.css`, `css/navbar.css`, `js/app.js` (navbar, profile menu, theme, modal), mirroring the Angular folders:
  - Login as its own page (brand panel with the white logo + sign-in form); Logout returns to it
  - Top navbar only (logo, menu, API status, profile menu with Profile settings / Theme / Logout); no sidebar
  - Dashboard: KPI cards, NG chart, recent inspections, inspections waiting for check
  - Inspections list with a "New inspection" modal; inspection detail = read-only Form 7.4.3-F1 check sheet, deliveries added and edited in a step-by-step modal (delivery + AQL → measurements → result)
  - Items, Vendors, AQL table, Users (each with its own add/edit modal), Profile settings
  - Light and dark mode; desktop, tablet and phone widths
  - Review 1 (2026-10-01): sidebar + header was two navigations → top navbar only; theme was in three places → profile menu only; typing into the big grid was hard → modals; login shared the app shell → separate page
  - Review 2 (2026-10-01): dummy data must look real → login checks the user list (`js/users.js`) and every page shows the signed-in user (name, initials, role); Users menu, add/edit buttons and the edit-rows action only for Admins; first admin is Gumilang (`070203`)
- [ ] Design tokens: palette (brand, neutrals, OK/NG/warning/info), Inter font bundled from npm, radius, elevation, spacing, motion; mapped onto Angular Material's `--mat-sys-*` variables
- [ ] Light / dark / system theme, saved per user (`usertable.theme`)
- [ ] Logos in `frontend/public/brand/` (original for light surfaces, white negative for dark/brand surfaces)
- [ ] Layout: top navbar only (logo, main menu with a "Master data" dropdown, API status, profile menu → Profile settings, Theme, Logout); below 960px the menu folds into a ☰ panel; smooth open/close transitions. Every component in its own `.ts` / `.html` / `.scss`
- [ ] Dialogs (`shared/ui/modal`): the only way to create or edit records; centered with a backdrop on desktop, full-screen below 600px, closable with Esc / ✕, focus trapped and restored
- [ ] Shared look for tables, forms, buttons, OK/NG and status chips, empty / loading / error states, toasts
- [ ] Login page, auth guard (redirect to login, then back), `must_change_password` flow, role-based menu
- [ ] Profile settings page (name, email, theme, change password)
- [ ] Dashboard page (data from the Phase 2 API)
- [ ] Accessibility: WCAG AA contrast in both themes, visible focus, keyboard navigation

### 3.1 Core
- [ ] `core/ApiService` unwrapping `{ success, data, meta }`; error interceptor → snackbar with `error.message`, field errors mapped from `error.details[]`
- [ ] `core/models/`: interfaces with the exact API field names; code maps mirrored from `backend/constants/`
- [ ] `shared/judgement.ts`: the same OK/NG rules as `judgement.js`, with a shared test-case table (JSON fixture used by both test suites)
- [ ] Shared components: server-side data table, lookup autocomplete, OK/NG badge, confirm dialog, loading indicator

### 3.2 Master data screens
- [ ] Items: list + detail with the standards grid (grouped STD / Certificate / Visual / Fitting), edit standards
- [ ] Vendors: list, create/edit form, CSV import
- [ ] Users (Admin only, replaces the former "Checkers" menu): list, create, edit role / active, reset password
- [ ] AQL table: plans, N / R / T tabs, the rows with the active range highlighted, a "try a lot size" calculator; editable by Admin

### 3.3 Inspection form (mirrors Form 7.4.3-F1)
- [ ] **Header:** Part name / Part no (item lookup), Supplier (vendor lookup), inspect date, measuring instrument
- [ ] Choosing the item loads `/api/inspections/template` and fills the lines; changing the item on a filled form asks for confirmation
- [ ] **Check sheet (read-only view):** rows = `STD` lines (No, Item, Standard, Tolerance), then Certificate No, Visual, Fitting; columns = 7 delivery columns of `Actual | OK/NG`; NG highlighted red
- [ ] **Delivery modal** (add, or click a filled column to edit), three steps:
  1. P/O No, delivery date, QTY received, category → AQL sample / Ac / Re shown live
  2. Measurements: one row per characteristic (Standard, Tolerance, Actual) with OK/NG as you type; Visual / Fitting OK/NG toggles; COA number + OK/NG. Enter moves to the next row
  3. Result: NG pieces (prefilled from step 2), suggested judgment, O / X / C, concession note, QF No
- [ ] **Footer rows per column:** P/O No, Delivery date, QTY received / Insp. category (N / R / T / 100 %), **Sample (AQL)** shown live (n, Ac, Re), NG / Total sample (NG pcs entered, prefilled from the grid; total from AQL), Judgment (O / X / C, with the system's suggestion highlighted), QF No
- [ ] Validation mirrors the server: unused columns disabled until the previous one is used, required fields per used column, `Accepted` disabled when NG > Ac, `Concession` only when NG ≥ Re and with a note
- [ ] Save draft (and autosave per column), unsaved-changes guard, server values replace local ones after each save
- [ ] Inspection list: filters (date range, item, supplier, status, judgment), paging, row actions (open, PDF)
- [ ] Read-only view for inspections outside `DRAFT`

### 3.4 Frontend quality
- [ ] Unit tests: services, `judgement.ts` (shared fixture), form validators
- [ ] Component test for the delivery modal: typing an out-of-tolerance value marks NG, prefills NG pieces and blocks Accepted above Ac
- [ ] Responsive: phone, tablet on the receiving floor (landscape) and desktop

**Phase 3 done when:** an inspector can log in, create, fill and save an inspection matching the filled example in `docs/chek sheet-qhse (cara isi).pdf`, with OK/NG identical to the server's result, in the approved design.

---

## Phase 4 — Reporting (PDF) & Approval Workflow

Goal: the inspection is signed off and prints as the official check sheet.

### 4.1 Approval workflow
- [ ] Migration `013_inspecttable_approval.sql`: `submitted_at`, `checked_at`, `return_reason`, `remarks` (only the columns Q6 leaves missing)
- [ ] Status flow `DRAFT → SUBMITTED → CHECKED`, and `SUBMITTED → DRAFT` (returned with a reason)
- [ ] `POST /api/inspections/:inspectnum/submit`: needs `inspectby`, all used columns judged; recomputes OK/NG; locks editing
- [ ] `POST /api/inspections/:inspectnum/check`: only a `CHECKER` or `ADMIN`; `checkedby` is the logged-in user; final
- [ ] `POST /api/inspections/:inspectnum/return`: `reason` required
- [ ] UI: Submit / Check / Return buttons shown only in the right status; status badge on list and form
- [ ] Tests: full flow, every wrong-status action returns `409`, `Accepted` with NG returns `422`

### 4.2 PDF report (Form 7.4.3-F1)
- [ ] Engine: Puppeteer + EJS template behind `reports/engine.js` → `renderInspectionPdf(inspection)`, so it can be swapped for PDFKit if the server can't run Chromium. Spike on WSL2 first.
- [ ] `reports/templates/inspection-check-list.ejs` copying `docs/chek sheet-qhse.pdf`:
  - Title block: *Form No : 7.4.3-F1*, *INCOMING INSPECTION CHECK LIST*, *PT. Chubb Safes Indonesia*, Rev / Tanggal / Hal. boxes (form revision from config)
  - Part name, Part no., Supplier name
  - Dimensions table (No, Item, Standard, Tolerance) + 7 × (Actual, OK/NG), grey Actual cells as on the form
  - Certificate No, Visual, Fitting rows
  - Footer rows: P/O No, Delivery date, Measuring Instrument, QTY received / Insp. Category, NG / Total sample (sample from the AQL snapshot), Judgment, QF No, Inspected by, Checked by
  - Legend: `*) T: Tightening N: Normal R: Reduce` · `**) O: Accepted X: Rejected C: Concession No Mark: 100 % inspection`
- [ ] A4 landscape; more than 13 STD lines continue on the next page with repeated headers; "Hal. X/Y"
- [ ] NG values marked; `DRAFT` / `SUBMITTED` inspections get a watermark, only `CHECKED` prints clean
- [ ] `services/report.service.js` reuses the inspection repository; one shared browser instance, limited concurrent renders, render timeout, browser closed on shutdown
- [ ] `GET /api/reports/inspections/:inspectnum/pdf` (`inline`; `?download=1` for attachment; filename `<inspectnum>.pdf`)
- [ ] `GET /api/reports/inspections/:inspectnum/html` preview (dev only)
- [ ] Frontend: PDF viewer dialog (iframe of the blob URL), download and print buttons, opened from the list and the form
- [ ] Tests: `application/pdf` + filename header, `404` for unknown id, HTML snapshot of the template

### 4.3 Release checklist
- [ ] Playwright E2E: log in as inspector → pick item → fill 2 delivery columns with one NG → judge → submit → log in as checker → check → open PDF
- [ ] QC walks through the app with the paper form side by side and signs off the layout

**Phase 4 done when:** a checked inspection opens as a correctly paginated 7.4.3-F1 PDF in under about 3 seconds, and QC accepts it as a replacement for the paper form.

---

## 5. Later (not scheduled)
- Dashboard drill-downs (NG rate per supplier, item and month); Excel export
- AQL switching rules (ISO 2859-1): suggest N → T after 2 of 5 consecutive lots rejected, T → N after 5 accepted, N → R after 10 accepted, per supplier and item
- Attachments (photos, COA scans) on an inspection
- Audit log of changes
- Deployment: Nginx serving the Angular build and proxying `/api`, PM2 for Node, database backups

## 6. Open questions
1. **Code maps:** are the values in §3 right for `inspectcategoryN`, `judgmentN` and `inspectstatus`? The two existing rows use `1` everywhere and look like test data — may they be deleted?
2. ~~**Vendors:** where does the supplier list come from?~~ **Answered 2026-10-01:** dummy data is fine, as long as table/column names and ids follow `csi_db`.
3. ~~**Tolerance edge cases:**~~ **Decided 2026-10-01:** STD rules without usable limits (700 zero-tolerance + 12 qualitative) are judged by the inspector, like a visual check.
4. ~~What does `inventtable.inspectqty` mean?~~ **Checked 2026-10-01:** `0` on all 1 685 items, so it is unused and ignored.
5. ~~**NG / Total sample:** where does the total sample come from?~~ **Decided 2026-10-01:** from the AQL plan (§2.3), snapshot in `samplesize1..7`. NG = defective pieces.
6. **Per-column sign-off:** the form has *QF No*, *Inspected by* and *Checked by* per delivery column, the schema has one each per inspection. Is one per form enough?
7. ~~Is `csi_db` shared with another application?~~ **Answered 2026-10-01:** no, it's a development copy. The `docs/` files are references for the form's shape, content and columns. Inspection numbers use the app's own table (`inspectnumseq`).
8. Should the PDF show the form revision as fixed `Rev. 01 / 24/10/23`, or from a setting?
9. **Precision:** `standard`, `tolerance_*` and `actual_N` are `decimal(18,2)`. 91 standards look stored ×100 (`0.0012` printed, `0.12` stored). Should those be judged in the stored unit, or do the columns need more decimals (a migration to `decimal(18,4)`)?
10. **Tolerance typos:** 9 standards have numbers that disagree with their tolerance text (see §3). **Decided 2026-10-01:** judging uses the stored numbers and the standard is flagged; QC still to say which is right.
11. Should *Inspected by* / *Checked by* store the user's full name (as the form prints it) or the username? Default: full name in the existing `varchar(50)` columns, plus a later migration for the user ids if traceability is needed.
12. **AQL plan (confirm with QC / Pak Fajar):** is the practice "ISO 2859-1 Special Level S-1 with zero defects (Ac 0 / Re 1)", as the filled example suggests, or a specific AQL value (and which)? One plan for all items, or per item / defect class (critical / major / minor)?
13. **Tightened / Reduced** for the default plan: is "one code letter larger / smaller" acceptable, or does QC use the ISO tightened / reduced tables?
14. **General Level II, AQL 2.5** values in §2.3 were entered from memory of the ISO tables: verify against the official standard before using that plan.
