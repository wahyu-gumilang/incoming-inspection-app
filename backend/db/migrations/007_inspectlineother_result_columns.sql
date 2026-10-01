-- Visual / Fitting / Certificate rows need a result per delivery column, like
-- inspectline: actual_txt_N holds the text (e.g. the COA number), status_N OK/NG.
ALTER TABLE inspectlineother
  ADD COLUMN IF NOT EXISTS standard_txt varchar(100) NULL DEFAULT NULL AFTER inspectitem,
  ADD COLUMN IF NOT EXISTS actual_txt_1 varchar(100) NULL DEFAULT NULL AFTER standard_txt,
  ADD COLUMN IF NOT EXISTS actual_txt_2 varchar(100) NULL DEFAULT NULL AFTER actual_txt_1,
  ADD COLUMN IF NOT EXISTS actual_txt_3 varchar(100) NULL DEFAULT NULL AFTER actual_txt_2,
  ADD COLUMN IF NOT EXISTS actual_txt_4 varchar(100) NULL DEFAULT NULL AFTER actual_txt_3,
  ADD COLUMN IF NOT EXISTS actual_txt_5 varchar(100) NULL DEFAULT NULL AFTER actual_txt_4,
  ADD COLUMN IF NOT EXISTS actual_txt_6 varchar(100) NULL DEFAULT NULL AFTER actual_txt_5,
  ADD COLUMN IF NOT EXISTS actual_txt_7 varchar(100) NULL DEFAULT NULL AFTER actual_txt_6,
  ADD COLUMN IF NOT EXISTS status_1 int(11) NULL DEFAULT NULL AFTER actual_txt_7,
  ADD COLUMN IF NOT EXISTS status_2 int(11) NULL DEFAULT NULL AFTER status_1,
  ADD COLUMN IF NOT EXISTS status_3 int(11) NULL DEFAULT NULL AFTER status_2,
  ADD COLUMN IF NOT EXISTS status_4 int(11) NULL DEFAULT NULL AFTER status_3,
  ADD COLUMN IF NOT EXISTS status_5 int(11) NULL DEFAULT NULL AFTER status_4,
  ADD COLUMN IF NOT EXISTS status_6 int(11) NULL DEFAULT NULL AFTER status_5,
  ADD COLUMN IF NOT EXISTS status_7 int(11) NULL DEFAULT NULL AFTER status_6;
