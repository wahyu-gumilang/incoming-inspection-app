-- Laravel's "Remember me" needs a per-user token. Existing rows stay NULL,
-- which disables the persistent cookie until the next login that asks for it.
ALTER TABLE usertable
  ADD COLUMN IF NOT EXISTS remember_token varchar(100) NULL DEFAULT NULL AFTER password_hash;
