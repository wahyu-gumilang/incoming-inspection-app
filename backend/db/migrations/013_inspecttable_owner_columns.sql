-- Who created an inspection, by user id (PLAN.md §2.4): inspectby keeps the printed
-- name, but only the id can decide who may edit a draft (creator or Admin).
-- created_at / updated_at are NULL on the legacy rows, whose real times are unknown.
ALTER TABLE inspecttable
  ADD COLUMN IF NOT EXISTS inspectbyid int(11) NULL DEFAULT NULL AFTER inspectby,
  ADD COLUMN IF NOT EXISTS created_at datetime NULL DEFAULT NULL AFTER recid,
  ADD COLUMN IF NOT EXISTS updated_at datetime NULL DEFAULT NULL AFTER created_at;
