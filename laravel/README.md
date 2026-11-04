# Incoming Inspection QC System

PHP 8.5, Laravel 13, Blade and Livewire 4 application for PT. Chubb Safes Indonesia.

The system records incoming inspections against Form No. 7.4.3-F1. It includes the
dashboard, items master data with standards, vendors, AQL input form, filled reports,
submit/check workflow, final PDF output, AQL plan administration, authentication,
application shell, profile settings and user management.

## Requirements

- PHP 8.5 with the MySQL extensions.
- MySQL or MariaDB. Development uses XAMPP MariaDB 10.4.
- Composer.

## Setup

```bash
cd laravel
cp .env.example .env
php85 artisan key:generate
php85 artisan db:setup --status
# After backing up csi_db:
php85 artisan db:setup --force
./serve
```

`db:setup` loads `database/sql/baseline.sql`, applies the numbered SQL migrations and records
them in `schema_migrations`. It refuses a non-test database unless `--force` is passed. Back up
the database before the first setup.

Test database:

```bash
DB_DATABASE=csi_db_test php85 artisan db:setup --fresh --seed
```

## Tests and formatting

```bash
cd laravel
php85 vendor/bin/phpunit
php85 vendor/bin/pint
```

## Application areas

| Area | Path |
|---|---|
| Authentication | `/login` |
| Dashboard | `/` |
| AQL Table (inspection input and plan management) | `/aql` |
| Reports (saved check sheets and final PDF) | `/reports` |
| Items | `/items` |
| Vendors | `/vendors` |
| User management (admin) | `/users` |
| UI component preview (admin) | `/ui-kit` |
| Profile | `/profile` |
| Help | `/help` |

The old `/inspections` URL redirects to the AQL Table.

## Inspection workflow

1. Create or edit a draft inspection in the AQL Table.
2. Submit it for checking. Draft and returned inspections remain editable.
3. A checker or admin approves the submitted inspection or returns it with a reason.
4. Checked inspections are locked and can be downloaded as the final PDF.

AQL plans are managed from the **Manage plans** dialog on the AQL Table by ADMIN and CHECKER
users. Vendor records include contact person, phone/WhatsApp, email, office address and joined
date. Usernames are numeric employee IDs; ADMIN can reset passwords and delete accounts.
Users can change their own password from Profile / User Settings. The Help Center provides
direct WhatsApp and email support links. The reusable interface components live in
`resources/views/components/ui` and are documented in `../CLAUDE.md`. Global component styles
are in `public/css/components.css`.

## Project rules

Read `../CLAUDE.md` and `../PLAN.md` before changing code. This application is the only
product codebase; the legacy Node and Angular code has been removed.
