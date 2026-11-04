-- Supplier profile fields used by the vendor master and inspection header.
ALTER TABLE vendtable
  ADD COLUMN IF NOT EXISTS contact_person varchar(100) NULL AFTER name,
  ADD COLUMN IF NOT EXISTS phone varchar(30) NULL AFTER contact_person,
  ADD COLUMN IF NOT EXISTS email varchar(100) NULL AFTER phone,
  ADD COLUMN IF NOT EXISTS address varchar(255) NULL AFTER email,
  ADD COLUMN IF NOT EXISTS joined_at date NULL AFTER address;
