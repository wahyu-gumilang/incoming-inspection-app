# CLAUDE.md

Coding guide for the Incoming Inspection QC System.

Read this file and PLAN.md before changing code. When this file and the code disagree,
inspect the code and the database schema, then update this file.

## 1. Project

The application is used by the Quality team of PT. Chubb Safes Indonesia to record,
evaluate and store incoming inspections of materials and parts received from suppliers.

The official reference is Form No. 7.4.3-F1, Incoming Inspection Check List. The printed
PDF must follow the layout of that form.

The final application is a PHP application. The Node/Express backend and the Angular
frontend are legacy reference code. Do not add product features to them.

## 2. Target stack

| Layer | Choice |
|---|---|
| Language | PHP 8.5. Production target: latest stable patch, currently 8.5.12. |
| Framework | Laravel 13. |
| UI | Blade templates and Livewire 4. |
| Database | MariaDB 10.4 in XAMPP for development, MySQL or MariaDB in WAMP for deployment. |
| PDF | mPDF or DomPDF. The final choice is still open. |
| Tests | Pest or PHPUnit, with Laravel feature tests. |
| Formatting | Laravel Pint. |
| Local server | PHP 8.5 built-in server. XAMPP supplies MariaDB and phpMyAdmin. |
| Deployment | WAMP with Apache and PHP 8.5. |

The legacy stack is Node.js with Express 5 and Angular 22. It remains available for
comparison and for porting tested business rules. It is not the target architecture.

## 3. Migration state

- The new application lives in the laravel directory.
- The legacy API lives in backend.
- The legacy UI lives in frontend.
- The first PHP proof of concept is GET /items. It reads inventtable and searches item id
  and name through Livewire.
- Authentication, master data, inspections, dashboard and PDF are not yet implemented in
  PHP.
- Keep the legacy folders until the PHP application reaches parity and the owner approves
  the cutover.

## 4. QC workflow

The application must support this workflow:

1. Sign in with a username and password.
2. Select an item and a supplier.
3. Load the item's standards automatically.
4. Enter up to seven delivery columns per inspection. Each column has a purchase order
   number, delivery date, received quantity and inspection category.
5. Enter the actual value for each characteristic in each delivery column.
6. Show OK or NG for each value immediately.
7. For each delivery, enter the number of defective pieces and show the AQL sample size,
   acceptance number and rejection number.
8. Choose Accepted, Rejected or Concession for each delivery.
9. Save the inspection with the inspector and checker names.
10. Print the result in the Form 7.4.3-F1 layout.

The seven Actual and OK-NG pairs on the paper form are seven delivery columns. They are not
seven samples of one delivery. Column N of inspectline belongs to header column N of
inspecttable.

## 5. Repository layout

| Path | Purpose |
|---|---|
| laravel | New Laravel 13 application. This is the only place for new product work. |
| backend | Legacy Node/Express API. Reference only. |
| frontend | Legacy Angular application. Reference only. |
| docs | Reference documents, design material and the migration plan. |
| docs/design/mockups | Old design mockups. Reference only until the new design is approved. |
| PLAN.md | Roadmap and source of truth for phases and decisions. |
| CLAUDE.md | This coding guide. |

Inside laravel, follow standard Laravel structure:

| Path | Purpose |
|---|---|
| app/Domain | Pure business rules such as judgement and AQL. |
| app/Models | Eloquent models for tables with a single primary key. |
| app/Repositories | Query builder classes for legacy and composite-key tables. |
| app/Services or app/Actions | Use cases and transactions. |
| app/Http/Controllers | Thin HTTP layer. |
| app/Http/Requests | Validation. |
| app/Livewire | Livewire components when a separate class is needed. |
| resources/views | Blade views and single-file Livewire components. |
| resources/css and resources/js | UI assets. |
| database/sql | Legacy baseline, SQL migrations and fixtures. |
| tests/Unit | Pure business rule tests. |
| tests/Feature | Page and database tests. |

## 6. Local development

The development runtime is a portable PHP 8.5 installation. XAMPP keeps MariaDB and
phpMyAdmin.

Commands:

| Command | Purpose |
|---|---|
| php85 -v | Check the PHP 8.5 runtime. |
| composer --version | Check Composer. |
| ./serve | Start the Laravel application from the laravel directory. |
| php85 -S 127.0.0.1:8000 -t public server.php | Start the application without the serve script. |
| php85 vendor/bin/phpunit | Run the PHP test suite. |
| php85 vendor/bin/phpunit --filter=Judgement | Run one test group. |
| php85 vendor/bin/pint | Format PHP code. |
| php85 vendor/bin/pint --test | Check formatting without writing. |
| DB_DATABASE=csi_db_test php85 artisan db:setup --fresh --seed | Rebuild csi_db_test from the baseline, migrations and fixtures. |
| php85 artisan db:setup --status | Show applied and pending migrations. |
| php85 artisan db:setup --force | Apply pending migrations to csi_db after a backup. |

Important:

- Do not use php artisan serve or php artisan test with the portable runtime. Laravel
  re-executes PHP_BINARY and the child process loses the portable library path, php.ini and
  extensions.
- Use the serve script or the built-in server command above during development.
- Run PHPUnit directly with php85 vendor/bin/phpunit.
- Existing password hashes use the bcrypt prefix $2b$. Keep App\Hashing\LegacyBcryptHasher
  in place: it accepts those hashes and rehashes them to Laravel's $2y$ format on login.
- The application database is csi_db.
- Database tests must use csi_db_test and must never touch csi_db.
- Copy laravel/.env.example to laravel/.env for a new environment.
- Never commit laravel/.env.
- XAMPP's PHP 8.2 is not used by the new application.

## 7. Domain rules

### 7.1 Seven delivery columns

- There are exactly seven delivery columns.
- The column numbers come from one fixed list. Never build column names from user input.
- A delivery column is used when it has a purchase order number or a received quantity.
  A delivery date alone does not make a column used.
- Delivery columns are filled in order. A later column cannot be filled before the previous
  one.
- Only the last used column can be removed.
- The header and all lines are written in one transaction.

### 7.2 Judgement engine

The judgement engine is a pure PHP component with no database access.

For STD rules:

- lower limit = standard - tolerance_minus.
- upper limit = standard + tolerance_plus.
- OK when lower limit <= actual <= upper limit.
- Tolerance text Min means OK when actual >= standard.
- Tolerance text Max means OK when actual <= standard.
- When both tolerances are zero, or the tolerance text is qualitative, the mode is MANUAL
  and the inspector sets OK or NG.
- A negative tolerance is used by its absolute size.
- Use integer hundredths for every comparison. Do not compare floating-point values
  directly.
- An empty actual value is NULL, meaning not measured. It is never NG.
- Invalid input must fail with a clear validation error.

The stored numbers are authoritative. If the tolerance text and the numbers disagree, use
the numbers and flag the standard. Do not silently correct master data.

Required functions or methods:

- ruleMode(rule): RANGE, MIN, MAX or MANUAL.
- limits(rule): lower and upper limits in hundredths.
- judgeValue(rule, actual): 1, 0 or NULL.
- judgeLine(rule, actuals, manualStatuses): status for each column.
- countNgCells(rows, columnCount): number of NG cells per column.
- minimumDefects(ngCells): at least one defective piece when a cell is NG.
- suggestJudgment(defects, plan): Accepted or Rejected suggestion.
- judgmentProblems(input): the server-side rules that block a save.

### 7.3 Qualitative lines

- VISUAL and FITTING lines are judged OK or NG by the inspector.
- CERTIFIKAT lines record the certificate number in actual_txt_N and are judged OK or NG by
  the inspector.
- An empty qualitative result is NULL, meaning not measured.

### 7.4 AQL

- AQL values come from the inspection's AQL plan.
- The lookup uses qty_receivedN and inspectcategoryN.
- The server recalculates the values on every save. Client values are ignored.
- The values are snapshotted into samplesizeN, acceptnumN and rejectnumN.
- Editing the AQL master must not change saved inspections.
- notgoodN is the number of defective pieces in the sample, not the number of NG cells.
- notgoodN must be at least one when any value in the column is NG.
- notgoodN cannot exceed the sample size.
- Accepted is rejected when notgoodN > acceptnumN.
- Rejected is always allowed when a plan exists.
- Concession is allowed only when notgoodN >= rejectnumN and a note is present.
- A used delivery column must have a judgment before submit.
- The final judgment is a human decision. The system only suggests.

The default plan, tightened and reduced rules, and acceptance values still need Quality
confirmation. Keep them in one place and treat them as provisional.

### 7.5 Snapshot and numbering

- Creating an inspection copies the item's standards into the inspection lines.
- Later changes to the master must not change a saved inspection.
- The inspection number comes from inspectnumseq under a row lock.
- The format is INS- followed by six digits, for example INS-000003.
- Skip numbers that are already used.
- Do not generate numbers in the browser.

### 7.6 Code maps

| Column | Values |
|---|---|
| inspectcategoryN | 0 = no mark or 100 percent, 1 = N Normal, 2 = R Reduced, 3 = T Tightening |
| judgmentN | 0 = not judged, 1 = O Accepted, 2 = X Rejected, 3 = C Concession |
| status_N | NULL = not measured, 1 = OK, 0 = NG |
| inspectstatus | DRAFT, SUBMITTED, CHECKED. Legacy integer values are read-only. |
| usertable.role | INSPECTOR, CHECKER, ADMIN |

Use PHP constants or enums. Do not write raw judgment or status numbers in services,
controllers, Livewire components or Blade views.

### 7.7 Schema facts

- vendtable.vendaccount and inspecttable.accountnum are different names for the vendor key.
  Keep each table's own column name.
- inspecttable.itemname and inspecttable.name are denormalized copies taken at save time.
  They are not joins.
- inventinspectitem.inspecttype may contain trailing spaces. Compare with TRIM in SQL and
  normalize in PHP. Do not rewrite the stored values because they are part of the primary
  key.
- inventinspectitem has composite primary key itemid, inspecttype, inspectitem.
- inspectline has composite primary key inspectnum, linenum.
- inspectlineother has composite primary key inspectnum, linenum.
- aqlplanrow has composite primary key planid, inspectcategory, lotmin.
- Eloquent does not support composite primary keys. Use the query builder or dedicated
  repository classes for those tables.
- inspectline.tolerance is a single decimal and cannot store asymmetric tolerances. Use the
  snapshot columns tolerance_txt, tolerance_plus and tolerance_minus.
- actual_N and status_N are nullable. NULL means not measured.
- deliverydateN used to default to today. Detect a used column from its purchase order or
  quantity, never from its date.
- Legacy inspections with inspectstatus 1 are read-only.
- oauth tables, orders and numseqtable belong to other systems. Do not modify them.

## 8. Database rules

- The application database is the existing csi_db.
- The schema is based on backend/db/baseline.sql and the SQL files in backend/db/migrations.
- The PHP copies used by the application live in laravel/database/sql. Keep them in sync with
  backend/db until cutover, and add every new migration to both directories.
- Rebuild csi_db_test with DB_DATABASE=csi_db_test php85 artisan db:setup --fresh --seed.
  The command refuses a database whose name does not end with _test unless --force is given.
- Do not rename or drop legacy columns.
- Do not edit an applied SQL migration. Add a new numbered migration instead.
- MariaDB commits DDL immediately. Keep each migration file to statements that are atomic on
  their own.
- Use CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, ADD INDEX IF NOT EXISTS and
  INSERT IGNORE where appropriate.
- Record applied migrations in schema_migrations.
- Generate docs/schema.sql after every schema change.
- Back up csi_db before applying a migration.
- Prove the migration on csi_db_test before applying it to csi_db.
- Database tests use csi_db_test only.
- Never commit csi_db.sql or any dump that contains real data.
- Never paste production rows, password hashes or oauth data into code, tests, docs or chat.

## 9. Laravel conventions

### 9.1 PHP style

- Follow PSR-12 and Laravel Pint.
- Use PHP 8.5 language features where they make the code clearer.
- Use strict comparisons and explicit return types for new domain and service code.
- Keep functions short and single-purpose.
- Use descriptive names. Avoid abbreviations that are not in the database schema.
- Comments explain why, not what. Do not leave commented-out code.

### 9.2 Layers

- Routes contain only route definitions and middleware.
- Controllers only read the request, call a service or action, and return a response.
- Form Requests handle validation and authorization.
- Livewire components handle page state and call services. They do not contain SQL.
- Services and actions contain business rules and transactions.
- Repositories contain query builder code for legacy and composite-key tables.
- Blade views contain presentation only. No business rules and no SQL.

### 9.3 Validation

- Validate every request and every Livewire update.
- Put reusable rules in Form Requests or dedicated rule classes.
- Return field-level errors that the Blade or Livewire view can display.
- Validate numeric precision explicitly. Actual values allow at most two decimals.
- Validate dates as real dates in YYYY-MM-DD format.
- Validate quantities as positive integers.
- Validate that a delivery column is filled in order.
- Validate that a used column has all required fields.
- Validate the judgment rules on the server. Never rely on disabled buttons in the browser.

### 9.4 Transactions

- Use DB::transaction or an explicit transaction for every write that touches more than one
  table.
- Lock the inspection header when saving a delivery or generating a number.
- Roll back on any failure.
- Keep the transaction short. Do not perform HTTP calls inside a transaction.

### 9.5 Authentication and authorization

- Use the Laravel session guard.
- Authenticate against usertable, not a new users table.
- Use the existing username and password_hash columns.
- Use Hash::check and never log or return password hashes.
- Use Laravel CSRF protection for all state-changing requests.
- Use the rate limiter for failed logins.
- Re-read the user's active state and role on each request.
- Use middleware for role checks: INSPECTOR, CHECKER, ADMIN.
- An Admin cannot demote, deactivate or reset their own account.
- Deactivate users; do not delete them, so names on old inspections remain valid.
- force password change must block all pages except the profile password page and logout.

### 9.6 Error handling

- Use Laravel validation errors for user input.
- Use a domain exception for business rule violations.
- Return 403 for a role or ownership violation.
- Return 404 for a missing record.
- Return 409 for a duplicate, an in-use record or a wrong status.
- Return 422 for a business rule violation that is not simple validation.
- Log unexpected errors with context. Do not show stack traces or SQL to the user.
- Do not swallow exceptions in Livewire actions.

### 9.7 SQL and models

- Use parameter binding or the query builder. Never concatenate request values into SQL.
- Keep SQL in repositories, not in controllers, Livewire components or Blade views.
- Use Eloquent for tables with a single primary key.
- Use the query builder for composite-key tables.
- Select only the columns that are needed.
- Use pagination for list pages.
- Whitelist sortable columns.
- Use dateStrings and decimal handling consistently. Store decimals as decimal(18,2) unless a
  migration changes the precision.

### 9.8 Constants and enums

- Put code maps in one place, for example app/Domain/Inspection/InspectionConstants.php.
- Use enums for role, status, judgment and rule mode where they improve type safety.
- Do not use magic strings or magic numbers in business code.
- Keep the database values exactly as specified in Section 7.6.

## 10. Blade and Livewire conventions

- Use Blade components for repeated layout pieces.
- Use class-based Livewire 4 components under app/Livewire with Blade views under
  resources/views/livewire. Keep single-file components only for very small isolated widgets.
- Keep component state small and typed.
- Use wire:model with an explicit debounce for search fields.
- Validate in the component or a Form Request before writing.
- Show loading, empty and error states.
- Use server-side pagination for large lists.
- Do not call the legacy REST API from the PHP application.
- Do not put business rules in JavaScript.
- JavaScript is allowed for menu state, theme, focus, transitions and browser-only
  behaviour.

## 11. UI and design

- The old mockups in docs/design/mockups are a reference only. The owner is reviewing the
  design direction again.
- The login page design was approved and finalized on 2026-10-27. Do not change its layout,
  background, card, copy or interactions without a new owner request.
- Do not finalize styling for other pages before the new mockups are approved.
- Use the Chubbsafes brand blue and the existing neutral palette as the starting point.
- Use the Inter font and the Material Symbols Rounded icon set.
- Support light and dark themes.
- Support desktop, tablet and phone widths.
- Use one top navigation bar. Do not add a sidebar.
- Every create or edit action opens a dialog. On phones the dialog uses the full screen.
- The check sheet keeps the structure of Form 7.4.3-F1. It may look more modern, but the
  rows, columns and footer must not drift from the paper form.
- The UI language is English, matching the labels on Form 7.4.3-F1.
- Do not use emojis or decorative Unicode in the application. In documentation, the only
  allowed non-ASCII characters are the status marks ✓ (done) and ✗ (not done).
- Meet WCAG AA contrast, visible focus and keyboard navigation.
- Respect reduced motion.

## 12. Testing

- Write unit tests for the judgement engine and the AQL engine.
- Write feature tests for every page and every write action.
- Test success paths and the main error paths.
- Test exactly on each limit and 0.01 outside each limit.
- Test Min, Max, zero tolerance, negative tolerance, qualitative tolerance and empty values.
- Test all seven delivery columns.
- Test AQL boundaries, 100 percent inspection, defective pieces and every judgment rule.
- Test inspection numbering under parallel creation.
- Test permissions for Inspector, Checker and Admin.
- Test transactions: a failed line update must not leave a partial delivery.
- Test the database against csi_db_test only.
- A test must create its own data or use the fixtures. It must not depend on rows changed by
  another test.
- Run the full suite before reporting a change as complete.

Commands:

| Command | Purpose |
|---|---|
| php85 vendor/bin/phpunit | Run all tests. |
| php85 vendor/bin/phpunit --filter=Judgement | Run one test group. |
| php85 vendor/bin/pint --test | Check formatting. |

## 13. Documentation style

PLAN.md and CLAUDE.md must stay clean and easy to scan.

- Use plain Markdown.
- Use ASCII characters except for the status marks ✓ (done) and ✗ (not done).
- Do not use any other emoji, decorative symbol, checkbox syntax or colored status mark.
- Use the status marks with a plain word in tables: ✓ Done, ✗ Next, ✗ Planned, ✗ Blocked.
- Use short headings and short sentences.
- Use tables for decisions, status, versions and mappings.
- Keep file paths, table names, column names and code terms exact.
- Update PLAN.md when a phase changes. Update CLAUDE.md when a convention changes.
- Do not paste real data, secrets, tokens or password hashes into documentation.

## 14. Git rules

- Keep main runnable.
- Work on feature/<short-description>, fix/<short-description> or chore/<short-description>.
- Use Conventional Commits: type(scope): summary.
- Use imperative mood and keep the subject within 72 characters.
- Types: feat, fix, refactor, test, docs, chore, perf.
- Scopes: auth, items, vendors, aql, inspections, reports, ui, db, docs.
- Keep each commit to one logical change.
- Run tests, Pint and a browser check before committing a UI or behaviour change.
- Never commit .env, .env.test, vendor, node_modules, database dumps, generated PDFs or
  uploaded files.
- Never use --no-verify.
- Never rewrite pushed history on main and never force-push main.
- Commit or push only when the user asks.

## 15. Working agreement

- Start by reading PLAN.md and the current migration phase.
- Check the real schema in docs/schema.sql or the SQL files before writing a query.
- Keep changes inside the requested scope.
- Match the existing code style and Laravel conventions.
- Do not add features to the legacy Node or Angular code.
- When the paper form and the schema disagree, use the schema for storage and the paper form
  for layout. Record the gap as an open question instead of inventing a column.
- Before saying a change is complete, run the tests and formatting check, open the page, and
  report what actually happened, including failures.
- Report blockers and environment problems honestly.

## 16. Open questions

| Topic | Question | Current handling |
|---|---|---|
| Design | What is the approved final UI direction? | Old mockups are reference only. Build functional screens first. |
| PHP patch | Is 8.5.12 required for development as well as production? | Development uses 8.5.4. Production will use 8.5.12. |
| Development server | Should development use the PHP built-in server or XAMPP Apache with PHP 8.5? | Built-in server until the owner approves an Apache change. |
| AQL plan | Is the current S-1 zero-defect plan the official practice? | Provisional. Confirm with Quality. |
| Tightened and reduced | Are the current one-letter rules correct? | Provisional. Confirm with Quality. |
| Per-column sign-off | Should QF number, inspector and checker be per delivery column? | One set per inspection for now. |
| Decimal precision | Should standard and actual columns use four decimals? | Keep decimal(18,2) and use stored numbers. |
| Tolerance typos | Which value is correct when text and numbers disagree? | Use stored numbers and flag the standard. |
| PDF engine | mPDF or DomPDF? | Decide with a real form prototype. |
| WAMP | Which WAMP build and PHP patch will production use? | Confirm before deployment. |
