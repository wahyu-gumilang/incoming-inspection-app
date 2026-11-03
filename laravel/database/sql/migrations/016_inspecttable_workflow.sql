-- Inspection submit/check workflow. DRAFT and RETURNED remain editable;
-- SUBMITTED waits for a CHECKER, and CHECKED is read-only.
ALTER TABLE inspecttable
  ADD COLUMN IF NOT EXISTS submitted_at datetime NULL DEFAULT NULL AFTER inspectstatus,
  ADD COLUMN IF NOT EXISTS returned_at datetime NULL DEFAULT NULL AFTER submitted_at,
  ADD COLUMN IF NOT EXISTS checked_at datetime NULL DEFAULT NULL AFTER returned_at,
  ADD COLUMN IF NOT EXISTS checkedbyid int(11) NULL DEFAULT NULL AFTER checkedby,
  ADD COLUMN IF NOT EXISTS return_note varchar(255) NULL DEFAULT NULL AFTER checked_at;
