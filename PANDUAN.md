# Panduan Aplikasi Incoming Inspection QC

Dokumen ini menjelaskan halaman, fitur, status workflow, hak akses, dan alur antarhalaman
pada aplikasi **Incoming Inspection QC PT. Chubb Safes Indonesia**.

Dokumen ini adalah panduan fitur. Aturan engineering dan keputusan teknis tetap berada di
`CLAUDE.md` dan `PLAN.md`.

- **Terakhir diperbarui:** 4 November 2026
- **Stack:** PHP 8.5, Laravel 13, Blade, Livewire 4, MariaDB/MySQL, DomPDF
- **Zona waktu aplikasi:** Asia/Jakarta
- **Login lokal:** `http://127.0.0.1:8000/login`
- **UI component preview:** `/ui-kit` (ADMIN)

---

## Daftar isi

1. [Ringkasan aplikasi](#1-ringkasan-aplikasi)
2. [Peta navigasi dan route](#2-peta-navigasi-dan-route)
3. [Alur utama](#3-alur-utama)
4. [Halaman per halaman](#4-halaman-per-halaman)
5. [Workflow dan hak akses](#5-workflow-dan-hak-akses)
6. [Alur antarhalaman](#6-alur-antarhalaman)
7. [Data, perhitungan, dan PDF](#7-data-perhitungan-dan-pdf)
8. [Peta kode untuk maintenance](#8-peta-kode-untuk-maintenance)
9. [Cara memperbarui dokumen ini](#9-cara-memperbarui-dokumen-ini)
10. [Catatan QA dan batasan saat ini](#10-catatan-qa-dan-batasan-saat-ini)

---

## 1. Ringkasan aplikasi

Aplikasi mencatat incoming inspection terhadap form **No. 7.4.3-F1**. Pemeriksaan mencakup
data item, supplier, delivery, AQL, dimensi, certificate, visual, fitting, keputusan
OK/NG, dan approval checker.

Fitur utama:

- Login dengan role **INSPECTOR**, **CHECKER**, dan **ADMIN**.
- Master item beserta standar pemeriksaan.
- Master vendor/supplier dengan profil kontak, alamat, dan tanggal bergabung, termasuk import CSV.
- AQL Table untuk membuat dan mengedit inspection.
- Perhitungan sample size, accept number, dan reject number dari AQL plan.
- AQL plan administration di dalam halaman AQL Table.
- Reports untuk melihat check sheet yang sudah tersimpan.
- Workflow **DRAFT → SUBMITTED → CHECKED**, dengan **RETURNED** untuk revisi.
- PDF final hanya untuk inspection yang sudah **CHECKED**.
- Dashboard berisi ringkasan workflow, recent inspections, dan master data.
- Input enabled dan disabled dibedakan secara visual; tooltip custom untuk tombol ikon.

---

## 2. Peta navigasi dan route

Navbar utama:

```text
Dashboard → AQL Table → Reports → Items → Vendor → User Management
```

`User Management` hanya terlihat oleh ADMIN.

| Halaman | Route | Akses | Fungsi |
|---|---|---|---|
| Login | `/login` | Guest | Autentikasi |
| Dashboard | `/` | Semua user login | Ringkasan pekerjaan QC |
| AQL Table | `/aql` | Semua user login | Membuat inspection baru |
| Edit inspection | `/aql/{inspectnum}/edit` | Owner/Checker/Admin, status editable | Mengedit DRAFT/RETURNED |
| Reports | `/reports` | Semua user login | Daftar inspection tersimpan |
| Detail report | `/reports/{inspectnum}` | Semua user login | Check sheet dan workflow |
| PDF report | `/reports/{inspectnum}/pdf` | Semua user login, status CHECKED | Download PDF final |
| Items | `/items` | Semua user login | Master item dan standar |
| Detail item | `/items/{itemid}` | Semua user login | Detail dan standar item |
| Vendors | `/vendors` | Semua user login | Master supplier |
| User Management | `/users` | ADMIN | Kelola user |
| Profile | `/profile` | Semua user login | Profil, avatar, tema |
| Help | `/help` | Semua user login | Panduan penggunaan |
| UI Kit | `/ui-kit` | ADMIN | Preview komponen UI |
| Legacy Inspection Form | `/inspections` | Semua user login | Redirect ke `/aql` |

Catatan: halaman placeholder **Inspection Form** sudah dihapus karena `/aql` adalah form
inspection yang sebenarnya. URL lama tetap diarahkan ke AQL Table.

---

## 3. Alur utama

```text
ADMIN/CHECKER menyiapkan AQL plan
        ↓
ADMIN menyiapkan item, standar, vendor, dan user
        ↓
INSPECTOR membuat inspection di AQL Table
        ↓
AQL dihitung otomatis dari plan + quantity + category
        ↓
Simpan sebagai DRAFT
        ↓
Report check sheet
        ↓
Submit → SUBMITTED
        ↓
CHECKER/ADMIN review
        ├── Approve → CHECKED → Download PDF
        └── Return  → RETURNED → Inspector revisi → Submit ulang
```

---

## 4. Halaman per halaman

### 4.1 Login — `/login`

Halaman login adalah desain final dan tidak diubah.

Fitur:

- Login memakai username dan password dari tabel `usertable`.
- Mendukung **Remember me**.
- Username dapat diingat setelah logout, password tidak pernah disimpan.
- Tombol Sign in memiliki loading state.
- User nonaktif tidak dapat login.
- Setelah login berhasil, user diarahkan ke Dashboard.
- Jika user wajib mengganti password, diarahkan ke halaman change password.
- Role user menentukan menu dan aksi yang tersedia.

---

### 4.2 Dashboard — `/`

Dashboard adalah ringkasan pekerjaan inspection.

#### Statistik workflow

- **Total inspections** — seluruh inspection yang tersimpan.
- **Draft & returned** — inspection yang masih menunggu tindakan inspector.
- **Submitted** — inspection yang menunggu review checker.
- **Checked** — inspection final yang siap diunduh sebagai PDF.

#### Recent inspections

Menampilkan inspection terbaru, meliputi:

- Nomor inspection.
- Item.
- Supplier.
- Status.
- Inspector.
- Tanggal.

Nomor inspection dapat diklik untuk membuka detail report.

#### Quick actions

- New inspection → AQL Table.
- Open reports → Reports.
- Browse items → Items.
- Manage vendors → Vendors.

#### Master data

Menampilkan jumlah:

- Items.
- Standards.
- Vendors.
- Active users.

---

### 4.3 AQL Table — `/aql`

Halaman utama untuk membuat inspection baru.

#### Header inspection

- Pilih **item** dengan rich combobox.
- Pilih **supplier/vendor** dengan rich combobox.
- Pilih **AQL plan** dengan rich combobox.
- Isi instrument bila diperlukan.
- Isi QF number bila diperlukan.

Semua select pada halaman AQL Table menggunakan komponen rich combobox yang sama.

#### Delivery dan AQL

Mendukung hingga **7 delivery**.

Field per delivery:

- P/O No.
- Delivery date.
- Received quantity.
- Inspection category.
- Not-good quantity.
- Judgment.
- Note.

Setelah quantity dan category diisi, aplikasi menghitung:

- Code letter.
- Sample size.
- Accept number.
- Reject number.

Nilai diambil dari AQL plan yang dipilih. Perhitungan diulang ketika plan, quantity, atau
category berubah.

#### Dimensi dan pemeriksaan

- Baris dimensi berasal dari standar item.
- Actual measurement dapat diisi untuk setiap delivery.
- Status OK/NG dihitung dari standard, tolerance plus, dan tolerance minus.
- Bagian certificate, visual, dan fitting juga tersedia.

#### Validasi input

- Item, supplier, dan AQL plan harus valid.
- Quantity dan category wajib diisi jika delivery digunakan.
- Judgment Accepted tidak boleh dipilih jika jumlah NG melebihi acceptance number.
- Panjang P/O, note, dan field lain mengikuti batas validasi masing-masing.
- Error ditampilkan pada field yang bermasalah.

#### Simpan dan edit

- **Save inspection** menyimpan inspection sebagai **DRAFT**.
- Setelah disimpan, user diarahkan ke detail report.
- **DRAFT** dan **RETURNED** dapat diedit.
- **SUBMITTED** dan **CHECKED** terkunci.
- Inspection legacy dengan status numerik lama bersifat read-only.

#### Manage plans

Tombol **Manage plans** tersedia untuk **CHECKER** dan **ADMIN**, di dalam halaman AQL Table.

Fitur plan:

- Daftar AQL plan.
- Tambah plan.
- Edit nama/deskripsi plan.
- Hapus plan dengan proteksi.
- Menentukan default plan.

Fitur row plan:

- Inspection category.
- Lot minimum.
- Lot maksimum.
- Code letter.
- Sample size.
- Accept number.
- Reject number.

Aturan plan:

- Lot range tidak boleh overlap.
- Plan terakhir tidak boleh dihapus.
- Plan yang sudah dipakai inspection tidak boleh dihapus.
- Jika default plan dihapus, plan lain dipromosikan menjadi default.
- Inspector tidak melihat tombol Manage plans.

---

### 4.4 Reports — `/reports`

Reports menampilkan inspection yang sudah tersimpan.

Fitur:

- Pencarian otomatis saat mengetik; tidak ada tombol Search terpisah.
- Pencarian berdasarkan:
  - Nomor inspection.
  - Item.
  - Supplier.
- Filter status:
  - All statuses.
  - Draft.
  - Submitted.
  - Checked.
  - Returned.
- Pagination.
- Kata kunci dan filter status tetap terbawa saat pindah halaman.
- Tombol Clear untuk menghapus filter.
- Tombol View untuk membuka detail report.

Kolom tabel:

- Inspection.
- Date.
- Item.
- Supplier.
- Status.
- Inspector.
- Action.

---

### 4.5 Detail report — `/reports/{inspectnum}`

Menampilkan check sheet yang sudah terisi.

Isi check sheet:

- Header Form No. 7.4.3-F1.
- Part name.
- Part number.
- Supplier name.
- Delivery dan AQL.
- Dimensi dengan actual measurement dan status OK/NG.
- Certificate.
- Visual.
- Fitting.
- Data inspector.
- Data checker.

Aksi halaman:

- **Back to reports**.
- **Print** — tersedia untuk semua status.
- **Download PDF** — hanya muncul jika status **CHECKED**.

#### Workflow panel

Panel workflow menampilkan status dan aksi sesuai role.

| Status | Aksi yang tersedia |
|---|---|
| DRAFT | Edit, Submit |
| RETURNED | Edit, Submit |
| SUBMITTED | Approve, Return |
| CHECKED | Tidak ada aksi perubahan |

Return membutuhkan alasan. Alasan disimpan dan ditampilkan pada inspection yang
dikembalikan.

---

### 4.6 Items — `/items` dan `/items/{itemid}`

Master data item dan standar pemeriksaan.

Fitur daftar:

- Pencarian item.
- Filter standar.
- Pagination.
- Buka detail item.

Fitur detail:

- Melihat informasi item.
- Melihat standar yang dikelompokkan.
- Rename item.
- Tambah standar.
- Edit standar.
- Hapus standar.

Standar item menjadi sumber baris dimensi pada AQL Table.

---

### 4.7 Vendors — `/vendors`

Master data supplier.

Fitur:

- Daftar vendor dengan account, nama, contact person, telepon, tanggal bergabung, dan jumlah inspection.
- Pencarian berdasarkan account, nama, contact person, telepon, email, atau alamat.
- Tambah vendor.
- Edit profil vendor:
  - Vendor account.
  - Vendor name.
  - Contact person.
  - Phone / WhatsApp.
  - Email.
  - Office address.
  - Joined date.
- Hapus vendor.
- Proteksi penghapusan jika vendor sudah dipakai inspection.
- Import vendor dari CSV dengan kolom opsional:
  - `vendaccount`
  - `name`
  - `contact_person`
  - `phone`
  - `email`
  - `address`
  - `joined_at`

Vendor menjadi sumber pilihan supplier pada AQL Table. Import dua kolom lama tetap didukung;
kolom profil yang tidak diisi tidak menghapus data profil yang sudah ada.

---

### 4.8 User Management — `/users`

Hanya dapat diakses **ADMIN**.

Fitur:

- Daftar user.
- Pencarian nama, username, atau email.
- Filter role.
- Filter status.
- Statistik user.
- Tambah user dengan temporary password.
- Username hanya boleh angka dan permanen setelah akun dibuat.
- Edit nama, email, dan role.
- Aktifkan/nonaktifkan user.
- Reset password: tombol key menghasilkan temporary password baru yang ditampilkan sekali; user wajib menggantinya saat sign-in berikutnya.
- User dapat mengganti password sendiri melalui **User Settings → Change password** di halaman Profile. Perubahan membutuhkan password saat ini dan langsung berlaku.
- Hapus user dengan konfirmasi.
- Proteksi agar admin tidak menonaktifkan atau menghapus dirinya sendiri.
- Proteksi agar admin terakhir yang aktif tidak terhapus.

Catatan: nama inspector/checker disimpan pada inspection, jadi riwayat inspection tetap
menampilkan nama yang tersimpan meskipun akun user dihapus.

Role:

- **INSPECTOR** — membuat dan mengirim inspection miliknya.
- **CHECKER** — review inspection, approve/return, mengelola AQL plan.
- **ADMIN** — seluruh akses, termasuk User Management.

---

### 4.9 Profile — `/profile`

Halaman Profile memakai layout dua kolom:

- **Kartu identitas** di kiri:
  - Avatar besar.
  - Nama lengkap.
  - Email.
  - Role.
  - Username.
  - Status aktif.
- **Form pengaturan** di kanan:
  - Foto profil: pilih file, hapus foto, batas JPG/PNG/WebP 2 MB.
  - Informasi pribadi: full name dan email.
  - Username dan role sebagai field read-only.
  - Appearance: kartu pilihan Light, Dark, atau System.
  - Tombol Save changes.

Fitur:

- Ubah data profil.
- Upload avatar.
- Hapus avatar.
- Pilih tema:
  - Light.
  - Dark.
  - System.
- Tema disimpan dan langsung diterapkan.
- Tombol **Change password** tersedia di header halaman Profile.
- Layout responsif: kartu identitas dan form menjadi satu kolom di layar kecil.

#### Account Option

Menu avatar di navbar berisi:

- Profil user dan role.
- **User Settings** — menuju Profile untuk nama, email, avatar, tema, dan password.
- **Help Center** — menuju panduan dan kontak support.
- **Sign out**.
- Pemilih tema Light, Dark, dan System.

Avatar memiliki tooltip **Account menu** saat di-hover.

---

### 4.10 Help — `/help`

Halaman bantuan berisi panduan:

- Akses aplikasi.
- Alur inspection.
- Penggunaan halaman utama.
- Password dan profile.
- Kartu panduan bernomor 01–03.
- Tombol Contact support yang mengarah ke bagian support.
- Kontak support langsung.

Tombol Back to dashboard sudah dihapus. Support dapat dihubungi melalui:

- **WhatsApp:** `+62 812-8197-3198` (`https://wa.me/6281281973198`).
- **Email / Outlook:** `wahyu.gumilang@gunnebo.com` (`mailto:`).

---

### 4.11 UI Kit — `/ui-kit`

Hanya ADMIN.

Halaman preview komponen `x-ui`:

- Button.
- Badge.
- Field.
- Search.
- Select.
- Modal.
- Confirmation.
- Pagination.
- Empty state.
- Stat card.
- Combobox.

Halaman ini membantu menjaga konsistensi tampilan saat menambah fitur baru.

---

### 4.12 Legacy Inspection Form — `/inspections`

Halaman placeholder lama sudah dihapus.

Perilaku sekarang:

```text
/inspections → redirect ke /aql
```

Tujuannya agar bookmark lama tetap berfungsi tanpa mempertahankan halaman kosong.

---

## 5. Workflow dan hak akses

### Status inspection

| Status | Arti | Editable | Aksi berikutnya |
|---|---|---|---|
| DRAFT | Inspection baru/belum dikirim | Ya | Submit |
| RETURNED | Dikembalikan checker untuk revisi | Ya | Edit lalu submit ulang |
| SUBMITTED | Menunggu review checker | Tidak | Approve atau Return |
| CHECKED | Final | Tidak | Download PDF |

### Matriks hak akses

| Aksi | INSPECTOR | CHECKER | ADMIN |
|---|---|---|---|
| Membuat inspection | Ya | Ya | Ya |
| Edit DRAFT/RETURNED milik sendiri | Ya | Ya | Ya |
| Edit DRAFT/RETURNED user lain | Tidak | Ya | Ya |
| Submit inspection milik sendiri | Ya | Ya | Ya |
| Submit inspection user lain | Tidak | Ya | Ya |
| Approve inspection | Tidak | Ya | Ya |
| Return inspection | Tidak | Ya | Ya |
| Manage AQL plans | Tidak | Ya | Ya |
| Download PDF CHECKED | Ya | Ya | Ya |
| User Management | Tidak | Tidak | Ya |
| Hapus user | Tidak | Tidak | Ya |

Catatan: inspection legacy dengan status numerik lama tidak dapat diedit atau diproses
melalui workflow baru.

---

## 6. Alur antarhalaman

### 6.1 Persiapan master data

1. ADMIN membuka **Items**.
2. Menambahkan item dan standar pemeriksaan.
3. ADMIN membuka **Vendors**.
4. Menambahkan vendor beserta contact person, telepon, email, alamat, dan tanggal bergabung, atau import CSV.
5. ADMIN membuka **User Management**.
6. Membuat user INSPECTOR, CHECKER, atau ADMIN.
7. CHECKER/ADMIN membuka **AQL Table → Manage plans**.
8. Menyiapkan plan dan row AQL, lalu menentukan default plan.

### 6.2 Membuat inspection baru

1. INSPECTOR membuka **AQL Table**.
2. Memilih item.
3. Memilih supplier.
4. Memilih AQL plan.
5. Mengisi delivery, quantity, category, dan data pemeriksaan.
6. AQL sample/accept/reject dihitung otomatis.
7. Menekan **Save inspection**.
8. Inspection tersimpan sebagai **DRAFT**.
9. User diarahkan ke detail report.

### 6.3 Submit untuk checking

1. Inspector membuka report DRAFT.
2. Menekan **Submit for checking**.
3. Status berubah menjadi **SUBMITTED**.
4. Inspection terkunci dari editing.

### 6.4 Approve

1. CHECKER/ADMIN membuka Dashboard atau Reports.
2. Melihat inspection berstatus **SUBMITTED**.
3. Membuka detail report.
4. Menekan **Approve**.
5. Status berubah menjadi **CHECKED**.
6. Nama checker dan waktu pengecekan tersimpan.
7. Tombol **Download PDF** muncul.

### 6.5 Return untuk revisi

1. CHECKER/ADMIN membuka report **SUBMITTED**.
2. Menekan **Return**.
3. Mengisi alasan pengembalian.
4. Status berubah menjadi **RETURNED**.
5. Inspector membuka report.
6. Menekan **Edit**.
7. Memperbaiki data di AQL Table.
8. Menyimpan perubahan.
9. Submit ulang.
10. Status kembali menjadi **SUBMITTED**.

### 6.6 Download PDF

1. Pastikan inspection berstatus **CHECKED**.
2. Buka detail report.
3. Klik **Download PDF**.
4. PDF dibuat dengan DomPDF menggunakan layout A4 landscape.
5. PDF berisi check sheet yang sudah tersimpan.

### 6.7 Pengaruh perubahan AQL plan

Nilai AQL per delivery disimpan saat inspection disimpan. Report menampilkan nilai yang
sudah tersimpan, sehingga perubahan plan di kemudian hari tidak mengubah hasil inspection
lama.

---

## 7. Data, perhitungan, dan PDF

### Tabel utama

| Tabel | Fungsi |
|---|---|
| `inspecttable` | Header inspection, delivery, AQL, status, dan data workflow |
| `inspectline` | Baris dimensi/standar dan actual measurement |
| `inspectlineother` | Baris certificate, visual, dan fitting |
| `aqlplan` | Header AQL plan |
| `aqlplanrow` | Row sample/accept/reject per category dan lot range |
| `inventtable` | Master item |
| `inventinspectitem` | Standar pemeriksaan item |
| `vendtable` | Master vendor |
| `usertable` | User dan role |

### Perhitungan AQL

Input:

- Plan.
- Inspection category.
- Received quantity.

Output:

- Code letter.
- Sample size.
- Accept number.
- Reject number.

Kategori `0` diperlakukan sebagai 100% inspection.

### Status OK/NG

Status dimensi dihitung dari:

- Actual measurement.
- Standard.
- Tolerance plus.
- Tolerance minus.

Status yang tersimpan ditampilkan kembali pada report dan PDF.

### PDF

- Engine: DomPDF.
- Orientasi: A4 landscape.
- Template: `resources/views/reports/pdf.blade.php`.
- Style: `public/css/pdf.css`.
- Hanya inspection **CHECKED** yang boleh mengunduh PDF.
- Inspection lain tetap dapat dicetak melalui tombol Print di browser.

---

## 8. Peta kode untuk maintenance

| Kebutuhan perubahan | Lokasi utama |
|---|---|
| Form inspection dan AQL | `laravel/app/Livewire/Inspections/InspectionForm.php` |
| Tampilan form inspection | `laravel/resources/views/livewire/inspections/inspection-form.blade.php` |
| Simpan/update inspection | `laravel/app/Services/InspectionService.php` |
| Aturan submit/approve/return | `laravel/app/Services/InspectionWorkflowService.php` |
| Panel workflow | `laravel/app/Livewire/Inspections/InspectionWorkflow.php` |
| Status dan label workflow | `laravel/app/Domain/Inspection/InspectionStatus.php` |
| Daftar report dan filter | `laravel/app/Http/Controllers/ReportsController.php` |
| Query report | `laravel/app/Repositories/InspectionRepository.php` |
| Tampilan report | `laravel/resources/views/reports/show.blade.php` |
| Template PDF | `laravel/resources/views/reports/pdf.blade.php` |
| Style PDF | `laravel/public/css/pdf.css` |
| AQL plan administration | `laravel/app/Livewire/AqlPlans/` |
| Aturan AQL plan | `laravel/app/Services/AqlPlanService.php` |
| Dashboard | `laravel/app/Http/Controllers/DashboardController.php` |
| Tampilan dashboard | `laravel/resources/views/dashboard.blade.php` |
| Komponen UI bersama | `laravel/resources/views/components/ui/` |
| Style komponen | `laravel/public/css/components.css` |
| Tooltip custom | `laravel/public/js/tooltip.js` |
| Search otomatis Reports | `laravel/public/js/auto-submit-search.js` |
| Account menu | `laravel/resources/views/components/app-navbar.blade.php` |
| Style account menu | `laravel/public/css/navbar.css` |
| Halaman Profile | `laravel/resources/views/profile/edit.blade.php` |
| Style Profile | `laravel/public/css/profile.css` |
| Halaman Help dan support | `laravel/resources/views/help/index.blade.php` |
| Style Help | `laravel/public/css/help.css` |
| Route | `laravel/routes/web.php` |
| Migrasi workflow | `laravel/database/sql/migrations/016_inspecttable_workflow.sql` |
| Migrasi profil vendor | `laravel/database/sql/migrations/017_vendtable_profile.sql` |
| Tes workflow dan PDF | `laravel/tests/Feature/InspectionWorkflowTest.php` |

---

## 9. Cara memperbarui dokumen ini

Saat menambah atau mengubah fitur:

1. Perbarui bagian halaman yang berubah.
2. Perbarui tabel route jika ada route baru.
3. Perbarui matriks hak akses jika aturan role berubah.
4. Perbarui alur antarhalaman jika ada langkah baru.
5. Perbarui peta kode jika file utama berpindah.
6. Perbarui bagian status akhir/QA jika jumlah tes berubah.
7. Ubah tanggal **Terakhir diperbarui** di bagian atas.

Dokumen ini sengaja berupa satu file Markdown agar mudah dibaca, di-diff, dan diperbarui
bersama perubahan kode.

---

## 10. Catatan QA dan batasan saat ini

- **Tes otomatis:** 125 tests, 568 assertions.
- **Formatter:** Pint lulus untuk 85 file.
- **Composer audit:** tidak ada security advisory.
- **PDF:** respons sudah diuji menghasilkan `application/pdf`. Pengecekan visual cetak
  sebaiknya dilakukan sekali pada printer/PDF viewer yang akan dipakai saat demo.
- **Legacy inspection:** status numerik lama bersifat read-only dan tidak mengikuti workflow
  baru.
- **Dashboard:** belum menampilkan grafik NG; grafik bersifat opsional.
- **Inspection Form lama:** sudah dihapus; `/inspections` hanya redirect ke `/aql`.

---

## 11. Audit UI/UX terakhir

Audit ini dilakukan pada 4 November 2026.

| Area | Temuan | Status |
|---|---|---|
| Input enabled/disabled | Enabled dan disabled sebelumnya memakai latar yang sama; teks disabled masih gelap. | Diperbaiki: enabled memakai `--surface`, disabled memakai latar abu-abu dan teks `--text-3`. |
| Select/combobox/dropdown disabled | Sebagian hanya memakai opacity. | Diperbaiki: latar, border, dan warna teks disabled sekarang konsisten. |
| `input mono` | Class `mono` membuat input terlihat lebih tebal dan besar. | Dihapus dari seluruh halaman; class CSS `.mono` juga dihapus. |
| Tombol Back | Ikon panah lurus terlalu generik. | Diganti dengan ikon `undo-2` pada semua tombol Back. |
| Tooltip tombol | Tooltip memakai atribut `title` bawaan browser dan labelnya terlalu detail. | Diganti dengan tooltip custom berstruktur, memiliki panah penunjuk, dan label tabel dibuat generik (`Edit row`, `Delete row`, `Reset password`, `Activate user`, `Deactivate user`). |
| User Management | Username menerima huruf; belum ada hapus user; status username permanen belum dijelaskan. | Username sekarang angka saja, ada hint permanen, dan ada hapus user dengan konfirmasi serta proteksi admin terakhir/self. |
| Reset password | Alur belum jelas di UI. | Key action menghasilkan temporary password baru; user wajib menggantinya saat sign-in berikutnya. |
| Reports search | Ada search input sekaligus tombol Search. | Tombol Search dihapus; pencarian berjalan otomatis setelah user berhenti mengetik. |
| Search bar toolbar | Lebar search bar berbeda antara Users, Vendors, Items, dan Reports. | Disamakan mengikuti Users: `flex: 1`, `min-width: 240px`, `max-width: 440px`; tombol Clear memakai cursor pointer. |
| Ganti password user | Hak ganti password ada tetapi kurang terlihat. | Change password dipusatkan di **User Settings/Profile**; Account Option hanya berisi User Settings, Help Center, dan Sign out. |
| Account Option | Item menu masih polos dan Change password duplikat. | User Settings dan Help Center memakai ikon, judul, deskripsi, dan panah; Change password dihapus dari menu. Avatar mendapat tooltip **Account menu**. |
| Help Center | Belum ada kontak support langsung dan masih ada Back to dashboard. | Ditambahkan kartu WhatsApp dan Email/Outlook; tombol Back to dashboard dihapus; kartu panduan diberi nomor dan hover state. |
| Profile settings | Form masih berupa satu kartu sempit dan tema memakai native select. | Dibuat layout dua kolom: kartu identitas + form terbagi per section; tema memakai kartu pilihan; avatar editor dan read-only identity dirapikan. |
| Reports/AQL Table | Layout input AQL dan check sheet Reports berbeda karena input adalah form interaktif dan Reports adalah Form 7.4.3-F1. | Perlu keputusan produk jika harus dibuat identik 1:1; label dan urutan bagian sudah diselaraskan. |
| Vendor | Hanya account dan nama. | Ditambah contact person, phone/WhatsApp, email, office address, joined date, dan kolom CSV opsional. |
| Table spacing | Dashboard memakai padding lebih rapat daripada tabel lain. | Disamakan ke 12px × 20px. |
| Navbar/page width | Navbar dan `.page` sama-sama memakai max-width 1448px. | Sudah konsisten. |
| Responsive | Tabel lebar, form vendor, modal, dan toolbar Reports berpotensi sempit di HP. | Tabel memakai horizontal scroll; form vendor menjadi satu kolom; modal menjadi full-screen; toolbar Reports wrap. |
| Dark mode | Komponen baru harus memakai token warna. | Tooltip, input disabled, select, combobox, dan vendor form memakai token tema. |
| Empty/loading/error | Sebagian besar halaman memiliki empty state dan error field; tombol submit memakai disabled saat loading. | Konsisten; spinner global masih opsional. |
| Login | Login adalah desain final. | Tidak diubah. |
