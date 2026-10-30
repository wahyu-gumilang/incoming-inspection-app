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
| PDF | A PHP PDF library, either mPDF or DomPDF. |
| Development | XAMPP MariaDB and phpMyAdmin, with PHP 8.5 CLI for the application. |
| Deployment | WAMP with Apache and PHP 8.5. |
| Legacy code | The Node/Express backend and the Angular frontend were removed on 2026-10-29. The PHP application is the only product codebase. |
| Design | The login page is final. The authenticated shell uses the two-tier navbar from 2026-10-28, and the reusable x-ui component library is the design system for new screens. |

The PHP application is in the laravel directory and is the only product codebase. Its SQL
schema and migrations live in laravel/database/sql. The legacy sources were removed to keep
the repository full PHP; their business rules are documented in CLAUDE.md and this plan.

### 2.1 Login page decisions

Date: 2026-10-28.

| Topic | Decision |
|---|---|
| Submit loading | The Sign in button shows a futuristic loader for at least 450ms. The inputs, password toggle and Remember me checkbox are locked, but the fields stay in the submitted form. |
| Remember me | Laravel keeps the session with usertable.remember_token. The application remembers the username in an encrypted, HttpOnly cookie for 400 days and prefills it after logout. |
| Password autofill | The application never stores the password. The form uses autocomplete and requestSubmit so Edge and Chrome can save and autofill it. |
| Caps Lock warning | Removed on 2026-10-28. The password eye remains. |
| Tests | Login tests cover the loading state, remember token, remembered username, failed login and inactive users. |

### 2.2 Application shell decisions

Date: 2026-10-28. Reference: `C:\Apps\Doc_QC-incoming-inspection\Navbar Idea 1.webp`. Adapted to an attached full-width header.

| Topic | Decision |
|---|---|
| Navbar | Attached full-width sticky two-tier header with a bottom divider, light and dark variants. Inner content is max-width 1448px. |
| Stability | The navbar stays at the same position across full page loads. No entry animation, stable scrollbar gutter, preloaded Manrope, fixed weather and date widths, and filemtime-versioned CSS/JS. |
| Top tier | Chubbsafes logo only, a shorter pill search, weather badge, date and avatar menu right. |
| Bottom tier | Only the primary navigation, centered, with Lucide outline icons and a short orange active underline. |
| Menu | Dashboard, Items, Inspection Form, AQL Table, Vendor, Reports and User Management. User Management is ADMIN only. |
| User menu | Compact disclosure panel (max 280px) with an upward notch under the avatar. The header shows the name and role only. Account Option contains User Setting, Help Center and Sign out. |
| Avatar | usertable.avatar_path photo when present; initials otherwise. Upload and remove on the Profile page. |
| Theme | Light, Dark and System segmented control below a divider. It saves usertable.theme and applies immediately. |
| Help | /help is a real Help Center page with access, inspection and support guidance. |
| Palette | Ink and neutral surfaces with an orange accent. Light page #e9edf2; dark page #070b12. |
| Type | Manrope, bundled locally at public/fonts/manrope-latin.woff2. No icon font. |
| Search | Submits to the Items page and prefills the item search. |
| Weather | Open-Meteo with Jakarta coordinates, a 15-minute browser cache and a --°C fallback. Keep fixed widths for the badge and date block so loading does not move the navbar. Confirm the plant location. |
| Placeholders | Modules without features yet use a shared placeholder page so every menu link works. |

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
| ✓ Done | Authentication and shell | Session login against usertable, persistent Remember me with a remembered username and browser password-manager support, roles, forced password change, profile settings, login rate limit and a functional Blade shell. The login page design was approved and finalized on 2026-10-27. The submit loading state, locked inputs and Remember me option were approved on 2026-10-28. The Caps Lock warning was removed. |
| ✓ Done | Application shell and navigation | Attached two-tier header with logo, pill search, live weather, date, avatar menu and centered module navigation. Manrope, Lucide outline icons, light and dark themes and responsive layouts. |
| ✓ Done | User Management | Admin-only list with search, role and status filters, pagination, create, edit, activate/deactivate, reset password and self-protection. Temporary passwords are generated once. |
| ✓ Done | UI component library | Reusable x-ui components for buttons, alerts, badges, stat cards, fields, search, dropdowns, modals, confirmations, pagination and empty states. Global styles, a User Management refactor and an admin preview at /ui-kit. |
| ✓ Done | Items master data | List, search, standards filter, pagination, detail with grouped standards, create, rename and standard CRUD. |
| ✗ Planned | Vendors | Vendor management and CSV import. |
| ✗ Planned | AQL administration | AQL plans and plan rows. |
| ✗ Planned | Inspections | List, creation, delivery columns, check sheet and judgments. |
| ✗ Planned | Dashboard | Basic database counts are shown. KPI cards, NG chart and recent inspections still need the inspection data. |
| ✗ Planned | Reporting | Submit and check workflow, PDF output. |
| ✓ Done | Authentication tests | PHPUnit covers login, logout, roles, forced password change, profile settings, dashboard, items, Remember me, the remembered username, the application navbar, the user menu, Help Center, theme persistence, profile photos, user management, the UI kit and the database setup command with 79 tests and 328 assertions. Judgement and AQL tests are next. |

Local addresses while the migration is in progress:

| Application | Address |
|---|---|
| PHP application (csi_db) | http://localhost:8000/login |
| UI component preview (admin) | http://localhost:8000/ui-kit |

### 3.2 Legacy source removal

The Node/Express backend and Angular frontend were removed on 2026-10-29. The repository is
full PHP. The database schema is preserved in laravel/database/sql and docs/schema.sql, and
the business rules are documented in CLAUDE.md. Do not reintroduce the old runtimes.

### 3.3 Reusable assets

| Asset | Location | Reuse |
|---|---|---|
| Database schema | docs/schema.sql and laravel/database/sql/baseline.sql | Keep the existing tables and columns for the PHP application. |
| SQL migrations | laravel/database/sql/migrations | `db:setup` applies these files. |
| Test fixtures | laravel/database/sql/fixtures | Reuse for the PHP test database. |
| OK and NG rules | Documented in CLAUDE.md | Implement and test them in PHP. |
| AQL rules | Documented in CLAUDE.md | Implement and test them in PHP. |
| Paper form | docs/chek sheet-qhse.pdf | Source of truth for the PDF layout. |
| Filled example | docs/chek sheet-qhse (cara isi).pdf | Source of truth for how the form is used. |
| UI components | laravel/resources/views/components/ui | Reuse for every authenticated page. The admin preview is /ui-kit. |

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

There is no separate REST API in the target application. The application is a full PHP
monolith; do not add a Node or Angular service.

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
- Use Laravel's remember-me cookie backed by usertable.remember_token.
- Remember the username in an encrypted, HttpOnly cookie. Never store the password in the application.
- Use autocomplete and requestSubmit so the browser password manager can save and autofill the password.
- Lock the login form while submitting without removing the fields from the form.

### 4.4 Repository layout

| Path | Purpose |
|---|---|
| laravel | The PHP application. This is the only product codebase. |
| docs | Reference files, SQL schema and this roadmap. |

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
| usertable | Application users. | userid primary key, unique username, role, password_hash, remember_token, active, must_change_password, theme. |
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
| ✓ Done | Final login page design, submit loading state, locked inputs, reduced-motion support and browser password-manager integration. |
| ✓ Done | Remember me: persistent session, remembered username and encrypted username cookie. |
| ✓ Done | Add usertable.remember_token through migration 014. |
| ✓ Done | Middleware for authentication, active user, must_change_password and role. |
| ✓ Done | Profile page for photo, name, email, theme and password change. |
| ✓ Done | Profile photo upload and removal with photo-or-initials avatars. |
| ✓ Done | Two-tier application header with logo, pill search, live weather, date, avatar menu and centered module navigation. |
| ✓ Done | User menu with Account Option, Help Center and a persistent Light/Dark/System theme control. |
| ✓ Done | Admin user management: list/search/filter, create with a temporary password, edit, activate/deactivate, reset password and self-protection. |
| ✓ Done | Reusable x-ui component library, global component styles, User Management refactor and an admin-only preview at /ui-kit. |
| ✓ Done | Functional Blade shell with the new navbar, avatar menu and theme support. Other page designs will follow the new tokens. |
| ✓ Done | Feature tests for login, logout, roles, inactive users, forced password change, loading state, Remember me, the remembered username, the navbar, the user menu, Help Center, theme persistence, profile photos, user management, the UI kit and items. |

### Phase P2 - Master data

| Status | Task |
|---|---|
| ✓ Done | Items list with search, paging and standard counts. |
| ✓ Done | Item detail with standards grouped by STD, CERTIFIKAT, VISUAL and FITTING. |
| ✓ Done | Item create and rename. |
| ✓ Done | Standard create, update and delete with the existing validation rules. |
| ✗ Planned | Vendor list, lookup, create, rename, delete and CSV import. |
| ✗ Planned | AQL plan list, plan detail, row editing and default plan selection. |
| ✓ Done | PHP tests for the item list, detail, create, rename, standard CRUD, filter state and role visibility. |
| ✗ Planned | Vendor and AQL rule tests documented in CLAUDE.md. |

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
| ✓ Done | Remove the legacy backend and frontend directories. Done on 2026-10-29; the repository is full PHP. |
| ✗ Planned | Update this plan and CLAUDE.md to reflect the final codebase. |

## 7. Testing and quality

- Use Pest or PHPUnit. Laravel feature tests cover routes, pages and database transactions.
- Unit tests cover the judgement engine and the AQL engine, including limits, Min, Max,
  empty values, negative tolerances, decimal edges and all seven columns.
- Feature tests cover the main success path and the main error paths for every page.
- Login tests cover the loading state, remember token, remembered username, failed login and inactive users.
- Navbar tests cover the primary menu, admin-only user management, module placeholders, the search query, the user menu, Help Center and theme persistence.
- Profile tests cover avatar upload, removal, validation and serving.
- User management tests cover admin access, search and filters, stat-card filter synchronization, create with a temporary password, edit, self-protection, activation and password reset.
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
| Design | How should new screens look? | The login page is final. The authenticated shell and the x-ui component library are the design system. Use /ui-kit as the reference. |
| Weather | Which location should the navbar weather show? | Open-Meteo with Jakarta coordinates, cached for 15 minutes. Confirm the plant location. |
| Remember me | Where is the password stored? | The application never stores it. It remembers the username in an encrypted HttpOnly cookie and lets Edge or Chrome save and autofill the password. |
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
6. The test suite is green and no legacy Node or Angular code remains.
