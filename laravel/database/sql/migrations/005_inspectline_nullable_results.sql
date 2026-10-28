-- Not measured must be distinguishable from measured-and-NG, so results
-- default to NULL instead of 0. Types are unchanged.
ALTER TABLE inspectline
  MODIFY actual_1 decimal(18,2) NULL DEFAULT NULL,
  MODIFY actual_2 decimal(18,2) NULL DEFAULT NULL,
  MODIFY actual_3 decimal(18,2) NULL DEFAULT NULL,
  MODIFY actual_4 decimal(18,2) NULL DEFAULT NULL,
  MODIFY actual_5 decimal(18,2) NULL DEFAULT NULL,
  MODIFY actual_6 decimal(18,2) NULL DEFAULT NULL,
  MODIFY actual_7 decimal(18,2) NULL DEFAULT NULL,
  MODIFY status_1 int(11) NULL DEFAULT NULL,
  MODIFY status_2 int(11) NULL DEFAULT NULL,
  MODIFY status_3 int(11) NULL DEFAULT NULL,
  MODIFY status_4 int(11) NULL DEFAULT NULL,
  MODIFY status_5 int(11) NULL DEFAULT NULL,
  MODIFY status_6 int(11) NULL DEFAULT NULL,
  MODIFY status_7 int(11) NULL DEFAULT NULL;
