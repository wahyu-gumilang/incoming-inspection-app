-- Optional profile photo for the authenticated shell. NULL means the avatar
-- falls back to the user's initials.
ALTER TABLE usertable
  ADD COLUMN IF NOT EXISTS avatar_path varchar(255) NULL DEFAULT NULL AFTER remember_token;
