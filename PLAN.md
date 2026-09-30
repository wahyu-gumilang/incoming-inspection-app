# PLAN.md — Incoming Inspection App Development Roadmap

Status: `[ ]` todo · `[~]` in progress · `[x]` done
Last updated: 2026-09-29

## 1. Goal

A web app for the Quality team to:

1. Maintain the **Item Master** (`inventtable`) with each item's inspection characteristics (`inventinspectitem`), and the **Vendor Master** (`vendtable`).
2. Record **incoming inspections**: a header per delivery (`inspecttable`) and measurement lines per characteristic (`inspectline`), judged OK/NG against standard ± tolerance.
3. Generate an **inspection result PDF** for each inspection.
4. Do all of the above through an **Angular** UI.

**Stack:** Node.js · Express 5 · MySQL `csi_db` (`mysql2/promise`) · PDFKit or Puppeteer · Angular.

## 2. Current state

- [x] Express 5 server: CORS, JSON body parsing, 404 and 500 handlers
- [x] `GET /api/health` with DB connectivity check
- [x] `config/db.js`: pool with WSL2 host auto-detection, `dateStrings`, `decimalNumbers`
- [x] `csi_db` imported with existing data
- [x] `CLAUDE.md` and `PLAN.md`
- [ ] Git: no commits yet

## 3. Data model (from `csi_db` — verify against `db/schema.sql`)

```
vendtable 1───* inspecttable 1───* inspectline *───1 inventinspectitem *───1 inventtable
                      *                                                         1
                      └─────────────────────────────────────────────────────────┘
```

| Table | Role | Known / expected columns |
|---|---|---|
| `inventtable` | Item master | item id (PK), item name, unit, … |
| `inventinspectitem` | Inspection characteristics per item | item id (FK), sequence, characteristic, method/instrument, `standard`, `tolerance`, unit |
| `vendtable` | Vendor master | vendor account (PK), name, address, contact, … |
| `inspecttable` | Inspection header | inspection id/no, vendor, item, PO/lot, `inspectdate`, `deliverydate1..7`, `qty_received1..7`, judgement, inspector, status, remarks |
| `inspectline` | Inspection lines | inspection id (FK), inspect-item ref, `standard`, `tolerance`, `actual_1..n`, line judgement |

The real PK/FK column names, the number of `actual_n` columns, and whether
tolerance is symmetric or split into upper/lower are confirmed in Phase 1.0 before
any repository code is written.

**Judgement rule (default, confirm with QC):**
- A measurement is OK if `standard − tolerance ≤ actual ≤ standard + tolerance`.
- A line is NG if any of its measurements is NG.
- The header is NG if any line is NG.
- Empty `actual_n` values are ignored. A line with no measurements is `PENDING`.

---

## Phase 1 — Master Data REST API (Item Master & Vendor Master)

### 1.0 Foundation (do first)
- [ ] `scripts/dump-schema.js` + `npm run db:schema` → `db/schema.sql`. Record the confirmed columns in §3.
- [ ] Split `server.js` into `app.js` (the Express app) and `server.js` (listen), so tests can load the app
- [ ] `routes/index.js` mounted at `/api`; keep `/api/health`
- [ ] `utils/AppError.js`, `utils/response.js` (`ok`, `created`), `utils/pagination.js`
- [ ] `middlewares/errorHandler.js` and `notFound.js` returning the JSON error shape from `CLAUDE.md`
- [ ] `middlewares/validate.js` + validation library (Zod recommended)
- [ ] Add ESLint, Prettier, Jest, Supertest; `npm run lint`, `npm test`
- [ ] Separate test database `csi_db_test` loaded from `db/schema.sql`, configured in `.env.test`
- [ ] Initial commit on `main`, then work on `feature/*` branches

### 1.1 Vendor Master — `vendtable`
| Method | Path | Description |
|---|---|---|
| GET | `/api/vendors` | List with `page`, `limit`, `sort`, `order`, `q` (search account/name) |
| GET | `/api/vendors/:accountnum` | Get one vendor |
| POST | `/api/vendors` | Create (`409 DUPLICATE_KEY` if the account already exists) |
| PUT | `/api/vendors/:accountnum` | Update (the key can't be changed) |
| DELETE | `/api/vendors/:accountnum` | Delete; `409` if any inspections reference the vendor |
| GET | `/api/vendors/lookup?q=` | Lightweight `{ accountnum, name }` list for dropdowns |

- [ ] `vendor.repository.js`, `vendor.service.js`, `vendor.controller.js`, `vendor.routes.js`, `vendor.validator.js`
- [ ] Integration tests: list/paging/search, get 404, create/duplicate, update, delete-in-use

### 1.2 Item Master — `inventtable` + `inventinspectitem`
| Method | Path | Description |
|---|---|---|
| GET | `/api/items` | List with paging, sort and search (id/name) |
| GET | `/api/items/:itemId` | Item with its `inspectItems[]` |
| POST | `/api/items` | Create an item (optionally with `inspectItems[]` in one transaction) |
| PUT | `/api/items/:itemId` | Update item fields |
| DELETE | `/api/items/:itemId` | Delete; `409` if any inspections reference it |
| GET | `/api/items/lookup?q=` | Dropdown list |
| GET | `/api/items/:itemId/inspect-items` | Inspection characteristics, ordered by sequence |
| PUT | `/api/items/:itemId/inspect-items` | Replace the whole list in one transaction (add, edit, delete, reorder) |
| POST / PUT / DELETE | `/api/items/:itemId/inspect-items/:lineId` | Change a single characteristic |

- [ ] Validation: `standard` and `tolerance` are numeric, `tolerance ≥ 0`, sequence is unique per item
- [ ] Repository, service, controller, routes and validator files for items and inspect-items
- [ ] Integration tests, including the replace-all transaction rolling back on invalid input

### 1.3 Database hygiene
- [ ] Review indexes on search/FK columns (`vendtable` name, `inventtable` name, `inventinspectitem` item id). Add them via `db/migrations/001_*.sql` if missing.

**Phase 1 done when:** all vendor and item endpoints return the standard JSON shapes, and `npm run lint && npm test` passes.

---

## Phase 2 — Incoming Inspection Transactions (`inspecttable` + `inspectline`)

### 2.1 Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/api/inspections` | List. Filters: `dateFrom`, `dateTo` (on `inspectdate`), `vendor`, `item`, `judgement`, `status`, `q` (no/PO/lot) |
| GET | `/api/inspections/:id` | Header + `lines[]` + vendor/item names |
| GET | `/api/inspections/template?itemId=` | New header defaults + lines pre-filled from `inventinspectitem` (standard, tolerance copied) |
| POST | `/api/inspections` | Create header + lines in **one transaction**. Returns `201` with the full inspection. |
| PUT | `/api/inspections/:id` | Update header + replace lines in one transaction (only while status is `draft`) |
| PATCH | `/api/inspections/:id/lines/:lineId` | Save one line's measurements (autosave from the grid) |
| POST | `/api/inspections/:id/submit` | Recalculate the judgement, lock for approval |
| POST | `/api/inspections/:id/approve` / `reject` | QC decision, with `reason` required on reject |
| DELETE | `/api/inspections/:id` | Only while status is `draft` |

### 2.2 Business rules (`services/inspection.service.js`)
- [ ] **Inspection number:** generated on the server, e.g. `IQC/YYYY/MM/####`. Match the existing format if the data already uses one. Must be unique even when two users save at the same time (lock the sequence row or retry on a duplicate key).
- [ ] **Deliveries:** up to 7 pairs of `deliverydateN` / `qty_receivedN`. Filled pairs must be consecutive, and a quantity needs a date. Total received = sum of the quantities.
- [ ] **Line snapshot:** each line copies `standard` and `tolerance` from `inventinspectitem` when created. Later changes to the master don't change past inspections.
- [ ] **Judgement:** a pure-function module `services/judgement.js`, computed on the server on every save. The client never decides it.
- [ ] **Status flow:** `draft → submitted → approved | rejected`, and `rejected → draft` to correct it. Actions in the wrong status return `409 INVALID_STATUS`.
- [ ] Vendor and item must exist (`422` if not).

### 2.3 Tests
- [ ] Unit tests for `judgement.js`: exactly on the limit, just outside it, empty samples, negative standards, decimal precision
- [ ] Integration tests: create with lines, rollback when a line fails, update blocked after submit, full status flow, filters

**Phase 2 done when:** an inspection can be created from the template, measured, submitted and approved through the API alone, with judgements computed correctly.

---

## Phase 3 — PDF Report Generator Engine

### 3.1 Engine choice
| | PDFKit | Puppeteer |
|---|---|---|
| How | Draw text and tables with code | Render an HTML/CSS template in headless Chrome |
| Pros | Lightweight, fast, no browser needed | Easy layout changes, wide tables, the same template can be previewed as HTML |
| Cons | Tables and page breaks are done by hand | Downloads Chromium (~170 MB), more RAM, needs Chrome dependencies on the server |

**Recommendation:** Puppeteer with an EJS template, because inspection sheets are wide tables
(lines × `actual_1..n` × deliveries) and layout changes are frequent. Keep the
engine behind an interface (`reports/engine.js` → `renderInspectionPdf(inspection)`)
so it can be switched to PDFKit if the deployment server can't run Chromium.

### 3.2 Tasks
- [ ] Spike: build the same one-page report with both engines on WSL2; confirm the choice
- [ ] `reports/templates/inspection-report.ejs`
  - Header: company logo, title, inspection no, dates, vendor, item, PO/lot, deliveries
  - Body: lines table (characteristic, standard, tolerance, actual_1..n, judgement)
  - Summary: overall judgement, remarks, inspector / checked by / approved by signature boxes
- [ ] Report layout: A4 landscape, repeating table headers across pages, page X of Y footer, NG values highlighted
- [ ] `services/report.service.js`: load the inspection (reuse the Phase 2 repository), render, return a buffer
- [ ] Reuse one browser instance for all requests, with a page pool or a limit on concurrent renders, and a render timeout. Close the browser on shutdown.
- [ ] Endpoints:
  - `GET /api/reports/inspections/:id/pdf`: `inline` for viewing, `?download=1` sends it as a download
  - `GET /api/reports/inspections/:id/html`: preview the template (dev only)
- [ ] Draft inspections get a "DRAFT" watermark
- [ ] Tests: returns `application/pdf`, returns `404` for an unknown id, a snapshot of the rendered HTML

**Phase 3 done when:** any inspection opens as a correctly paginated PDF in the browser in under about 3 seconds.

---

## Phase 4 — Frontend (Angular UI)

### 4.1 Setup (`client/`)
- [ ] `ng new client` (standalone components, routing, SCSS). UI kit: Angular Material.
- [ ] `proxy.conf.json` sends `/api` to `http://localhost:5000`, and the API base URL comes from `environments/`
- [ ] `core/`:
  - `ApiService` that unwraps `{ success, data, meta }`
  - HTTP error interceptor that shows `error.message` in a snackbar
  - loading indicator
- [ ] `shared/`: data table with server-side paging/sort/search, confirm dialog, lookup autocomplete (vendor/item), judgement badge (OK/NG/PENDING)
- [ ] App shell: sidebar with Master Data (Items, Vendors), Inspections, and a top bar
- [ ] TypeScript interfaces in `core/models/` that match the API JSON field names exactly

### 4.2 Master Forms
- [ ] **Vendors:** list page (search, paging) and a create/edit form (reactive form with validation messages from the API `details[]`)
- [ ] **Items:** list page and an item form with an editable **inspection characteristics grid** (add, remove, reorder, standard/tolerance input)

### 4.3 Inspection Form
- [ ] **List page:** filters (date range, vendor, item, judgement, status), paginated table, "New inspection"
- [ ] **Form page:**
  - Header section: vendor and item lookups, PO/lot, inspect date, 7 delivery date/qty rows with a live total
  - When an item is chosen, load `/api/inspections/template` to fill the lines
  - **Measurement grid:** rows = characteristics, columns = `actual_1..n`. Keyboard navigation (Enter/Tab moves to the next cell). Each cell turns OK/NG as you type, using the same rule as the backend. The saved server value is authoritative.
  - Actions: Save draft, Submit, Approve/Reject (only in the right status), Print/PDF
  - Warn when leaving with unsaved changes
- [ ] Read-only view for submitted/approved inspections

### 4.4 PDF Viewer
- [ ] Viewer page/dialog that embeds `/api/reports/inspections/:id/pdf` (`ngx-extended-pdf-viewer`, or an `<iframe>` of the blob URL as a first version)
- [ ] Download and print buttons. Loading and error states.
- [ ] Open from the inspection list (row action) and from the inspection form

### 4.5 Frontend quality
- [ ] Unit tests for services and the judgement helper. A component test for the measurement grid.
- [ ] E2E smoke test (Playwright): create vendor → create item with characteristics → create inspection → submit → open PDF

**Phase 4 done when:** a QC user can do the whole flow (master data → inspection → PDF) in the browser without using the API directly.

---

## 5. Later (not scheduled)
- Authentication and roles (JWT; inspector / QC supervisor / viewer) before any real deployment
- Dashboard: NG rate per vendor, item and month. Excel export.
- Attachments (photos, mill certificates) on an inspection
- Audit log of changes to inspections
- Deployment: Nginx serving the Angular build and proxying `/api`, PM2 for Node, database backups

## 6. Open questions
1. What are the exact PK/FK columns linking `inspecttable` ↔ `inspectline` ↔ `inventinspectitem`? (Answered by the Phase 1.0 schema dump.)
2. How many `actual_n` columns are there, and is that the fixed maximum number of samples?
3. Is `tolerance` a single ± value, or are there separate upper/lower limits? Are there attribute (visual OK/NG) characteristics?
4. Does the existing data already use an inspection number format that must be continued?
5. Is `csi_db` shared with another system (e.g. an ERP sync)? If so, the API may need to treat some tables or columns as read-only.
6. Is the PDF layout fixed by an existing paper form? If yes, get a sample to copy.
