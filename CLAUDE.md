# CLAUDE.md

AI coding guide for this repository. Read this and `PLAN.md` before making changes.

## Project

**Incoming Inspection App** — the Quality team records inspections of incoming
supplier deliveries against each item's inspection standard, then prints the
result as a PDF report.

- **Backend (repo root):** Node.js, Express 5, MySQL via `mysql2/promise`, CommonJS modules.
- **Database:** `csi_db` (already imported). Core tables:
  - `inventtable`: item master
  - `inventinspectitem`: inspection characteristics per item (standard, tolerance)
  - `vendtable`: vendor master
  - `inspecttable`: inspection header
  - `inspectline`: inspection detail lines (measurements)
- **Frontend (`client/`):** Angular, not created yet. See Phase 4 in `PLAN.md`.
- **Roadmap:** `PLAN.md` is the source of truth. Work on the current phase and tick its checkboxes when a task is done.

## NPM scripts

Run from the repo root.

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `nodemon server.js` | Dev server with auto-reload on `http://localhost:5000` |
| `npm start` | `node server.js` | Production start |
| `npm test` | `jest` | Unit + integration tests *(set up in Phase 1)* |
| `npm run lint` | `eslint .` | Lint *(set up in Phase 1)* |
| `npm run format` | `prettier --write .` | Format *(set up in Phase 1)* |
| `npm run db:schema` | `node scripts/dump-schema.js` | Write `csi_db` table definitions to `db/schema.sql` *(set up in Phase 1)* |

Frontend (from `client/`): `npm start` (dev server, port `4200`, proxies `/api` to `5000`), `npm run build`, `npm test`.

Quick check: `curl http://localhost:5000/api/health` should return `"db": "connected"`.

Add new commands as `package.json` scripts, not as ad-hoc instructions.

## Environment

Copy `.env.example` to `.env`. `.env` is never committed.

| Variable | Meaning |
|---|---|
| `PORT` | API port (default `5000`) |
| `DB_HOST` | `auto` tries `127.0.0.1`, then the WSL2 default gateway (the Windows host). An explicit host is tried first. |
| `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` | MySQL connection (`DB_NAME=csi_db`) |

Development runs on WSL2, with MySQL usually on the Windows host. `config/db.js`
detects the host and rebuilds the pool after network errors. Don't replace it with a
plain `mysql.createPool()`.

## Folder structure

```
.
├── server.js                  # Entry: load env, start app.listen()
├── app.js                     # Express app: middleware, /api router, 404 + error handler
├── config/
│   └── db.js                  # MySQL pool (exports query / execute / getConnection)
├── routes/
│   ├── index.js               # Mounts all routers under /api
│   ├── item.routes.js         # /api/items, /api/items/:itemId/inspect-items
│   ├── vendor.routes.js       # /api/vendors
│   ├── inspection.routes.js   # /api/inspections, /api/inspections/:id/lines
│   └── report.routes.js       # /api/reports/inspections/:id/pdf
├── controllers/               # HTTP only: read req, call a service, send the response
├── services/                  # Business rules: judgement, status rules, transactions
├── repositories/              # All SQL. One file per table group.
├── validators/                # Request schemas per resource
├── middlewares/               # validate, errorHandler, notFound
├── utils/                     # AppError, response helpers, pagination
├── reports/
│   ├── templates/             # HTML/EJS templates (Puppeteer) or PDFKit layout modules
│   └── assets/                # Logo, fonts
├── scripts/                   # One-off/dev scripts (schema dump, seeds)
├── db/
│   ├── schema.sql             # Generated snapshot of csi_db, for reference
│   └── migrations/            # Numbered SQL: 001_add_indexes.sql, ...
├── tests/                     # Mirrors source: tests/services/inspection.service.test.js
└── client/                    # Angular app (own package.json)
```

- Request flow: `route → validate → controller → service → repository → db`. Each layer calls only the layer below it.
- File names are kebab-case with a role suffix: `vendor.controller.js`, `vendor.service.js`, `vendor.repository.js`.
- Only create a folder when the first file needs it.

## JSON response conventions

Every API response uses one of these shapes.

**Single resource: `200 OK` or `201 Created`**
```json
{ "success": true, "data": { "itemid": "RM-0001", "itemname": "Bracket A" } }
```

**List: `200 OK`**
```json
{
  "success": true,
  "data": [ { "accountnum": "V-001", "name": "PT Supplier" } ],
  "meta": { "page": 1, "limit": 20, "total": 134, "totalPages": 7 }
}
```

**Error: `4xx` or `5xx`**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [ { "field": "inspectdate", "message": "must be a valid date" } ]
  }
}
```

Rules:
- Build responses with `utils/response.js` (`ok(res, data, meta?)`, `created(res, data)`). Don't hand-write `res.json({...})` in controllers.
- **Status codes:**
  - `200`: read or update
  - `201`: create
  - `204`: delete, with no body
  - `400`: validation failed
  - `404`: not found
  - `409`: duplicate key or wrong status for the action
  - `422`: business rule violation
  - `500`: unexpected error
- **Error codes** are UPPER_SNAKE constants: `VALIDATION_ERROR`, `NOT_FOUND`, `DUPLICATE_KEY`, `INVALID_STATUS`, `INTERNAL_ERROR`.
- Never send stack traces or SQL errors to the client. Log them on the server and return `INTERNAL_ERROR`.
- **Field names** in JSON match the `csi_db` column names (lowercase, e.g. `itemid`, `accountnum`, `inspectdate`, `deliverydate1`). Don't rename them to camelCase, so the frontend, API and DB all use the same names.
- **Types:**
  - Dates: `"YYYY-MM-DD"` strings. The pool returns them this way (`dateStrings: true`).
  - Datetimes: ISO 8601.
  - Decimals: JSON numbers (`decimalNumbers: true`).
- **List queries:** `?page=1&limit=20&sort=field&order=asc|desc&q=search`. `limit` defaults to 20 and is capped at 100. Only whitelisted columns can be used for `sort`.
- **PDF endpoints** are the only exception: they return `application/pdf` with `Content-Disposition: inline; filename="<inspection-no>.pdf"`.

## Coding conventions

- Use CommonJS (`require` / `module.exports`) and `async`/`await`. No callbacks or `.then()` chains.
- Formatting: 2-space indent, single quotes, semicolons, trailing commas (Prettier).
- **Express 5:** errors from async handlers go to the error middleware automatically. Don't add try/catch or `asyncHandler` wrappers just to call `next(err)`.
- Throw `new AppError(status, code, message, details?)` for expected failures. Anything else becomes a `500` in the error handler.
- Validate `params`, `query` and `body` in the route, before the controller runs.
- **SQL:**
  - Always use placeholders (`execute('... WHERE itemid = ?', [id])`). Never put request values into SQL strings.
  - SQL only lives in `repositories/`, and repositories return plain rows (not mysql2 `[rows, fields]` tuples).
  - A header and its lines (`inspecttable` + `inspectline`) are always written in **one transaction**. Get a connection with `getConnection()`, then `beginTransaction`, `commit` or `rollback`, and `release()` in `finally`.
- **Existing schema:** `csi_db` was imported with existing data.
  - Don't rename or drop columns.
  - Schema changes (indexes, new columns) go in a new numbered migration file. Never change an applied migration.
  - Check `db/schema.sql` for the real column names. Don't guess.
- Keep comments for the *why*. No commented-out code.
- **Tests:** Jest + Supertest. Every service with business logic (tolerance judgement, status changes) gets unit tests. Every endpoint gets an integration test for the success path and the main error paths.

## Git rules

- **Branches:** `main` is always runnable. Work on `feature/<short-desc>`, `fix/<short-desc>` or `chore/<short-desc>`, then merge into `main` with a PR (or `--no-ff` locally).
- **Commit messages:** Conventional Commits, `type(scope): summary`, imperative mood, 72 characters max.
  - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`.
  - Scopes: `items`, `vendors`, `inspections`, `reports`, `client`, `db`.
  - Example: `feat(inspections): save header and lines in one transaction`
- Keep each commit to one logical change, and make sure lint and tests pass before committing.
- **Never commit:** `.env`, `node_modules/`, generated PDFs, uploaded files, database dumps containing real data.
- Don't rewrite pushed history on `main` (no force-push).
- **Claude:** only commit or push when the user asks. Never use `--no-verify`, and never change git config.

## Working agreements for Claude

- Start each task by checking `PLAN.md` for the current phase and `db/schema.sql` for the real columns.
- Keep changes to the requested scope and match the existing code style.
- Before saying a change is done, run the dev server and call the endpoint (or run `npm test`), and report what actually happened.
