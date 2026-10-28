-- Each line keeps its own copy of the standard so later edits to
-- inventinspectitem don't change saved inspections. The existing single
-- `tolerance` decimal can't hold +0.3/-0, Min or Max, hence the new columns.
-- Types match inventinspectitem.
ALTER TABLE inspectline
  ADD COLUMN IF NOT EXISTS inspecttype varchar(50) NULL DEFAULT NULL AFTER linenum,
  ADD COLUMN IF NOT EXISTS standard_txt varchar(100) NULL DEFAULT NULL AFTER inspectitem,
  ADD COLUMN IF NOT EXISTS tolerance_txt varchar(50) NULL DEFAULT NULL AFTER tolerance,
  ADD COLUMN IF NOT EXISTS tolerance_plus decimal(19,2) NULL DEFAULT NULL AFTER tolerance_txt,
  ADD COLUMN IF NOT EXISTS tolerance_minus decimal(19,2) NULL DEFAULT NULL AFTER tolerance_plus;
