-- "Measuring Instrument" is one row for the whole form 7.4.3-F1. The indexes
-- back the inspection list filters (date range, item, supplier).
ALTER TABLE inspecttable
  ADD COLUMN IF NOT EXISTS instrument varchar(100) NULL DEFAULT NULL AFTER inspectstatus,
  ADD INDEX IF NOT EXISTS idx_inspecttable_inspectdate (inspectdate),
  ADD INDEX IF NOT EXISTS idx_inspecttable_itemid (itemid),
  ADD INDEX IF NOT EXISTS idx_inspecttable_accountnum (accountnum);
