# PLAN.md - Incoming Inspection QC System

This file is the roadmap and the source of truth for the application. Read it together with
CLAUDE.md before making changes.

Status marks: ✓ = done, ✗ = not done.

## 1. Goal

Build a web application for the Quality team of PT. Chubb Safes Indonesia to record,
evaluate and store incoming inspections of materials and parts received from suppliers.

The application replaces the paper form Form No. 7.4.3-F1, Incoming Inspection Check List.
The printed result must follow the layout of that form.

The Quality team must be able to:

1. Sign in with a username and password.
2. Select an item and a supplier.
3. Load the item's inspection standards automatically.
4. Record up to seven delivery columns with purchase order, delivery date, quantity and
   inspection category.
5. Enter the actual measurements and receive OK or NG feedback for each value.
6. Enter the number of defective pieces for each delivery and see the AQL sample size,
   acceptance number and rejection number.
7. Select the final judgment for each delivery: Accepted, Rejected or Concession.
8. Save the inspection with the inspector and checker names.
9. Print the inspection in the Form 7.4.3-F1 layout as a PDF.

## 2. Decision record

Date: 2026-10-27.

The owner confirmed the final technology direction:

| Topic | Decision |
|---|---|
| Language and runtime | PHP 8.5. The production target is the latest stable patch, currently 8.5.12. |
| Framework | Laravel 13. |
| User interface | Laravel Blade with Livewire 4. Server-rendered PHP with minimal browser JavaScript. |
| Database | MariaDB 10.4 in XAMPP for development. MySQL or MariaDB in WAMP for deployment. |
| PDF | A PHP PDF library, either mPDF or DomPDF. Puppeteer and other Node-based tools are not part of the final stack. |
| Development | XAMPP MariaDB and phpMyAdmin, with PHP 8.5 CLI for the application. |
| Deployment | WAMP with Apache and PHP 8.5. |
| Legacy code | The Node/Express backend and the Angular frontend are kept as a reference until the PHP application reaches parity. |
| Design | The old mockups are a reference only. The final UI direction will be reviewed and approved again before the final Blade and Livewire screens are built. |

The current PHP proof of concept is in the laravel directory. It already reads real data
from csi_db. The legacy application remains in backend and frontend for comparison and for
the business rules that have already been tested.

## 3. Current state

### 3.1 PHP application

| Status | Item | Notes |
|---|---|---|
| ✓ Done | Portable PHP 8.5 runtime | PHP 8.5.4 from the Ubuntu 26.04 packages, installed in the user home directory. XAMPP and Apache were not modified. |
| ✓ Done | Composer | Composer 2.10.3 in the user home directory. |
| ✓ Done | Laravel application | Laravel 13.38.0 in the laravel directory. |
| ✓ Done | Livewire | Livewire 4.4.8. |
| ✓ Done | Database connection | Laravel connects to the XAMPP MariaDB database csi_db. |
| ✓ Done | Proof of concept page | GET /items reads inventtable and searches item id and name through Livewire. |
| ✓ Done | Database setup command | `php85 artisan db:setup` loads `laravel/database/sql/baseline.sql`, the SQL migrations and the fixtures into a fresh database or `csi_db_test`. Applied migrations are recorded in `schema_migrations`. |
| ✓ Done | Authentication and shell | Session login against usertable, roles, forced password change, profile settings, login rate limit and a functional Blade shell. The login page design was approved and finalized on 2026-10-27. Admin user management is next. |
| ✗ Planned | Master data | Items, standards, vendors and users. |
| ✗ Planned | AQL administration | AQL plans and plan rows. |
| ✗ Planned | Inspections | List, creation, delivery columns, check sheet and judgments. |
| ✗ Planned | Dashboard | Basic database counts are shown. KPI cards, NG chart and recent inspections still need the inspection data. |
| ✗ Planned | Reporting | Submit and check workflow, PDF output. |
| ✓ Done | Authentication tests | PHPUnit covers login, logout, roles, forced password change, profile settings, dashboard, items and the database setup command with 30 tests and 98 assertions. Judgement and AQL tests are next. |

Local addresses while the migration is in progress:

| Application | Address |
|---|---|
| PHP application (csi_db) | http://localhost:8000/login |
| Legacy Angular application | http://localhost:4200 |
| Legacy Node API | http://localhost:5000 |
| Design mockups | http://localhost:8080/index.html |

### 3.2 Legacy prototype

The legacy application is not the final product. It is a working reference. It already
contains:

- Session authentication with users, roles, deactivation and forced password change.
- Items and standards management.
- Vendor management, vendor lookup and CSV import.
- AQL plans, AQL rows, lookup and default plan selection.
- Inspection list, inspection creation, delivery columns and the read-only check sheet.
- The delivery dialog with three steps: delivery and sample, measurements, result.
- Dashboard statistics.
- Backend unit tests and database integration tests.
- Frontend unit tests, component tests and route tests.

No new product features should be added to backend or frontend. Only critical fixes are
allowed there until the PHP application is complete.

### 3.3 Reusable assets

| Asset | Location | Reuse |
|---|---|---|
| Database schema | docs/schema.sql and backend/db/baseline.sql | Keep the existing tables and columns for the PHP application. |
| SQL migrations | backend/db/migrations and laravel/database/sql/migrations | Keep both copies in sync until cutover. `db:setup` applies the laravel copy. |
| Test fixtures | backend/db/seeds/test-fixtures.sql and laravel/database/sql/fixtures | Reuse for the PHP test database. |
| OK and NG rules | backend/services/judgement.js | Port the rules and test cases to PHP. |
| AQL rules | backend/services/aql.js | Port the rules and test cases to PHP. |
| Paper form | docs/chek sheet-qhse.pdf | Source of truth for the PDF layout. |
| Filled example | docs/chek sheet-qhse (cara isi).pdf | Source of truth for how the form is used. |
| Old mockups | docs/design/mockups | Reference only until the owner approves the new design direction. |

## 4. Target architecture

### 4.1 Application style

The final application is a Laravel monolith with server-rendered pages.

- Laravel routes call controllers or Livewire components.
- Validation lives in Form Requests or Livewire validation rules.
- Business rules live in service or action classes under app/Domain or app/Services.
- Database access lives in Eloquent models or query builder classes under app/Repositories.
- Blade views render the pages.
- Livewire components handle interactive forms such as the delivery dialog, filters and
  live AQL lookup.
- JavaScript is limited to browser behaviour such as menu state, theme, focus and
  transitions. It must not contain business rules.

There is no separate REST API in the target application. The legacy REST API remains
available only as a reference.

### 4.2 Request flow

Browser request:

1. Route.
2. Middleware for authentication, role, CSRF and rate limit.
3. Controller or Livewire component.
4. Form Request or Livewire validation.
5. Service or action.
6. Repository, Eloquent model or query builder.
7. Database.
8. Blade view.

### 4.3 Authentication

- Use the Laravel session guard.
- Authenticate against the existing usertable.
- Keep the existing roles: INSPECTOR, CHECKER and ADMIN.
- Keep the existing user states: active, inactive and must_change_password.
- Use Laravel CSRF protection.
- Use Laravel's rate limiter for failed login attempts.
- Never store authentication tokens in browser storage.

### 4.4 Repository layout

| Path | Purpose |
|---|---|
| laravel | New PHP application. |
| backend | Legacy Node API. Reference only. |
| frontend | Legacy Angular application. Reference only. |
| docs | Reference files, design material and this roadmap. |

### 4.5 Local development

The development runtime is a portable PHP 8.5 installation in the user home directory.
XAMPP supplies MariaDB and phpMyAdmin. XAMPP's bundled PHP 8.2 is not used by the new
application.

The PHP binary is available through the wrapper command php85. Composer is available as
composer. The Laravel application runs with the PHP built-in server because php artisan
serve re-executes PHP_BINARY and does not inherit the portable runtime configuration.

## 5. Data model

The database is the existing csi_db database. The PHP application does not replace it and
does not rename legacy columns.

### 5.1 Core tables

| Table | Purpose | Key facts |
|---|---|---|
| inventtable | Item master. | Primary key itemid. inspectqty is unused. |
| inventinspectitem | Standards per item. | Composite primary key: itemid, inspecttype, inspectitem. Types are STD, VISUAL, FITTING and CERTIFIKAT. |
| vendtable | Supplier master. | vendaccount is the vendor key. It maps to inspecttable.accountnum. |
| inspecttable | One inspection form. | Primary key inspectnum. Holds up to seven delivery columns. |
| inspectline | Dimension lines for an inspection. | Composite primary key: inspectnum, linenum. Contains actual_1 to actual_7 and status_1 to status_7. |
| inspectlineother | Visual, fitting and certificate lines. | Composite primary key: inspectnum, linenum. Contains actual_txt_1 to actual_txt_7 and status_1 to status_7. |
| usertable | Application users. | userid primary key, unique username, role, password_hash, active, must_change_password, theme. |
| aqlplan | AQL plans. | planid primary key. One plan is the default. |
| aqlplanrow | Ranges for one AQL plan and category. | Primary key: planid, inspectcategory, lotmin. |
| inspectnumseq | Inspection number sequence. | Used to generate INS-000001 style numbers. |
| schema_migrations | Applied SQL migrations. | Used by the migration runner. |

Legacy tables owned by other systems, including oauth tables, orders and numseqtable, must
not be modified.

### 5.2 Code maps

| Column | Values |
|---|---|
| inspectcategoryN | 0 = no mark or 100 percent inspection, 1 = N Normal, 2 = R Reduced, 3 = T Tightening |
| judgmentN | 0 = not judged, 1 = O Accepted, 2 = X Rejected, 3 = C Concession |
| status_N | NULL = not measured, 1 = OK, 0 = NG |
| inspectstatus | DRAFT, SUBMITTED, CHECKED. Legacy integer values are shown as read-only. |
| usertable.role | INSPECTOR, CHECKER, ADMIN |

Code maps must live in one PHP constants or enum file and must be mirrored in the UI where
needed. Business code must not contain raw numbers such as judgment = 2.

### 5.3 Judgement rules

For STD lines:

- lower limit = standard - tolerance_minus.
- upper limit = standard + tolerance_plus.
- A value is OK when lower limit <= actual <= upper limit.
- Tolerance text Min means OK when actual >= standard.
- Tolerance text Max means OK when actual <= standard.
- When both tolerances are zero, or the tolerance text is qualitative, the rule mode is
  MANUAL and the inspector chooses OK or NG.
- A negative tolerance is used by its absolute size.
- All comparisons use integer hundredths. Never compare decimal floats directly.
- An empty actual value is NULL, which means not measured. It is never NG.
- The stored numbers are authoritative. Doubtful standards are flagged, not silently
  corrected.

For qualitative lines:

- VISUAL and FITTING lines are judged OK or NG by the inspector.
- CERTIFIKAT lines record the certificate number in actual_txt_N and are judged OK or NG by
  the inspector.

### 5.4 AQL rules

The AQL plan gives the sample size, acceptance number and rejection number for each
delivery.

- The values come from the inspection's AQL plan, based on qty_receivedN and
  inspectcategoryN.
- The server recalculates them on every save.
- The values are snapshotted into samplesizeN, acceptnumN and rejectnumN.
- Editing the AQL master never changes a saved inspection.
- notgoodN is the number of defective pieces in the sample. It is not the number of NG
  cells. One defective piece can have more than one NG dimension.
- The inspector enters notgoodN. It must be at least one when any value in that column is NG.
- The system suggests Accepted when notgoodN <= acceptnumN.
- The system suggests Rejected when notgoodN >= rejectnumN.
- The final judgment is a human decision.
- Accepted is rejected by the server when notgoodN > acceptnumN.
- Concession is allowed only when notgoodN >= rejectnumN and a note is present.
- A used delivery column must have a judgment before the inspection is submitted.

The default plan and the rules for tightened and reduced inspection still need confirmation
from Quality, as recorded in Section 9.

### 5.5 Snapshot and numbering

- Creating an inspection copies the item's standards from inventinspectitem into
  inspectline and inspectlineother.
- Later edits to the master never change a saved inspection.
- The inspection number is generated on the server from inspectnumseq under a row lock.
- The format is INS- followed by six digits, for example INS-000003.
- Numbers already in use are skipped.
- The header and all its lines are written in one database transaction.

### 5.6 Known schema facts and quirks

- vendtable.vendaccount and inspecttable.accountnum are different column names for the
  same vendor key. Keep each table's own column name.
- inspecttable.itemname and inspecttable.name are denormalized copies taken when the
  inspection is saved. They are not joins.
- inventinspectitem.inspecttype can contain trailing spaces, for example FITTING and VISUAL
  with a trailing space. Compare with TRIM in SQL and normalize in PHP. Do not rewrite the
  stored values because they are part of the primary key.
- inspectline.tolerance is a single decimal column. It cannot store asymmetric tolerances.
  The snapshot columns tolerance_txt, tolerance_plus and tolerance_minus hold the real
  values.
- actual_N and status_N are nullable after migration 005. NULL means not measured.
- deliverydateN used to default to today. An unused column is detected by its purchase order
  number or quantity, never by its date.
- inspectlineother originally had no result columns. Migrations 004 and 007 added the
  primary key and result columns.
- Legacy inspections with inspectstatus 1 are shown as read-only.

## 6. Migration phases

### Phase P0 - Environment and proof of concept

| Status | Task |
|---|---|
| ✓ Done | Install PHP 8.5 CLI with pdo_mysql, mbstring, xml, curl, zip, bcmath and intl. |
| ✓ Done | Install Composer locally. |
| ✓ Done | Create Laravel 13 in laravel and connect it to csi_db. |
| ✓ Done | Add Livewire 4 and render the first item list proof of concept. |
| ✓ Done | Read real data from inventtable and inventinspectitem. |
| ✓ Done | Add a basic PHPUnit feature test for the /items page against csi_db_test. |
| ✓ Done | Add a development script (serve) that starts the PHP built-in server with the portable runtime. |
| ✓ Done | Add a PHP command that applies baseline.sql, the SQL migrations and the fixtures to a test database. |

### Phase P1 - Authentication and application shell

| Status | Task |
|---|---|
| ✓ Done | Custom user provider and guard for usertable. |
| ✓ Done | Login, logout, session cookie and CSRF protection. |
| ✓ Done | Login rate limit and equal error messages for unknown users and wrong passwords. |
| ✓ Done | Middleware for authentication, active user, must_change_password and role. |
| ✓ Done | Profile page for name, email, theme and password change. |
| ✗ Planned | Admin user management: invite or create user, change role, deactivate, reset password. |
| ✓ Done | Functional Blade shell with navbar, profile menu and theme switch. The login page design is final. Other page designs are pending the new mockups. |
| ✓ Done | Feature tests for login, logout, roles, inactive users and forced password change. |

### Phase P2 - Master data

| Status | Task |
|---|---|
| ✗ Planned | Items list with search, paging and standard counts. |
| ✗ Planned | Item detail with standards grouped by STD, CERTIFIKAT, VISUAL and FITTING. |
| ✗ Planned | Item create and rename. |
| ✗ Planned | Standard create, update and delete with the existing validation rules. |
| ✗ Planned | Vendor list, lookup, create, rename, delete and CSV import. |
| ✗ Planned | AQL plan list, plan detail, row editing and default plan selection. |
| ✗ Planned | Port the item, vendor and AQL tests from the legacy backend. |

### Phase P3 - Inspections

| Status | Task |
|---|---|
| ✗ Planned | Inspection list with filters, paging, status and judgment. |
| ✗ Planned | Create inspection from item and supplier; snapshot the standards on the server. |
| ✗ Planned | Generate the inspection number under a row lock. |
| ✗ Planned | Delivery step 1: purchase order, delivery date, quantity and category with live AQL values. |
| ✗ Planned | Delivery step 2: actual values, live OK and NG, visual, fitting and certificate results. |
| ✗ Planned | Delivery step 3: defective pieces, suggested judgment, human judgment and concession note. |
| ✗ Planned | Server-side recalculation of all statuses and AQL values. |
| ✗ Planned | Check sheet view in the Form 7.4.3-F1 structure. |
| ✗ Planned | Read-only mode for submitted and checked inspections. |
| ✗ Planned | Dashboard with KPI cards, NG chart and recent inspections. |
| ✗ Planned | Feature tests for every judgment rule, numbering, snapshot, permissions and transactions. |

### Phase P4 - Reporting and approval

| Status | Task |
|---|---|
| ✗ Planned | Status flow DRAFT to SUBMITTED to CHECKED, with return from SUBMITTED to DRAFT. |
| ✗ Planned | Submit action: requires the inspector, all used columns judged and a server-side recalculation. |
| ✗ Planned | Check action: only CHECKER or ADMIN; records the checker and timestamp. |
| ✗ Planned | Return action: requires a reason. |
| ✗ Planned | PDF template for Form 7.4.3-F1 with a PHP PDF engine. |
| ✗ Planned | A4 landscape, repeated table headers, page X of Y and a watermark for non-checked inspections. |
| ✗ Planned | Print and download from the inspection page. |
| ✗ Planned | Tests for the PDF response and the approval flow. |

### Phase P5 - Cutover

| Status | Task |
|---|---|
| ✗ Planned | Full test suite and manual QC walkthrough against the paper form. |
| ✗ Planned | WAMP deployment with Apache, PHP 8.5 and the production database. |
| ✗ Planned | Backup and restore procedure. |
| ✗ Planned | Remove the legacy backend and frontend directories after owner sign-off. |
| ✗ Planned | Update this plan and CLAUDE.md to reflect the final codebase. |

## 7. Testing and quality

- Use Pest or PHPUnit. Laravel feature tests cover routes, pages and database transactions.
- Unit tests cover the judgement engine and the AQL engine, including limits, Min, Max,
  empty values, negative tolerances, decimal edges and all seven columns.
- Feature tests cover the main success path and the main error paths for every page.
- Database tests use csi_db_test, never csi_db.
- A database test must create or reset its own data. It must not depend on rows that another
  test changes.
- Run the full test suite before reporting a change as complete.
- Run Laravel Pint before committing.
- Check the page in a browser for every UI change.

## 8. Deployment

The final deployment uses WAMP with Apache and PHP 8.5.

Deployment checklist:

1. Install PHP 8.5 with the required extensions.
2. Point the Apache virtual host document root to laravel/public.
3. Create the production database and import the schema and data.
4. Configure .env with the production database, application key and session settings.
5. Set storage and bootstrap cache permissions.
6. Run the database setup command.
7. Run php artisan optimize.
8. Configure HTTPS, backups and log rotation.
9. Smoke test login, inspection creation, delivery save, check and PDF.

## 9. Risks and open questions

| Topic | Open question | Current handling |
|---|---|---|
| Design | The old mockups are being reviewed again. | The login page is final as of 2026-10-27. Build other screens functionally until the owner approves the new direction. |
| PHP patch | XAMPP has PHP 8.2.12. The development runtime is 8.5.4. Production should be 8.5.12. | Use the portable PHP 8.5 runtime for development and install 8.5.12 for deployment. |
| Development server | XAMPP Apache cannot run Laravel 13 with its bundled PHP. | Use the PHP built-in server during development. Configure XAMPP Apache or WAMP only after approval. |
| AQL plan | The default plan and the tightened and reduced rules still need Quality confirmation. | Keep the current plan and rules as provisional. |
| Decimal precision | Some standards are stored with two decimals while the printed text has more. | Use the stored numbers for judgement and flag doubtful standards. |
| Tolerance typos | Some tolerance texts disagree with the numeric limits. | Use the stored numbers and flag the standard. Quality decides the correction. |
| Per-column sign-off | The paper form has QF number, inspector and checker per delivery column. The schema has one set per inspection. | Use one set per inspection for now. Record the gap. |
| PDF engine | mPDF and DomPDF are candidates. | Decide with a real Form 7.4.3-F1 prototype. |
| WAMP version | The target WAMP build and PHP patch are not confirmed. | Confirm before deployment. |

## 10. Definition of done

The migration is done when:

1. A QC inspector can sign in and complete an inspection that matches the filled example in
   docs/chek sheet-qhse (cara isi).pdf.
2. The saved OK and NG values match the server calculation.
3. The AQL sample size, acceptance number and rejection number are correct.
4. A checker can check the inspection and the PDF matches Form 7.4.3-F1.
5. The application runs on WAMP with PHP 8.5 and the production database.
6. The test suite is green and the legacy backend and frontend are no longer needed.
