-- The app's own number sequence for inspectnum (INS-000001). The row is locked
-- with SELECT ... FOR UPDATE when a number is taken, so concurrent saves can't
-- get the same number. Starts after the highest existing INS- number.
CREATE TABLE IF NOT EXISTS inspectnumseq (
  prefix varchar(10) NOT NULL,
  digits int(11) NOT NULL,
  nextnum int(11) NOT NULL,
  PRIMARY KEY (prefix)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

INSERT IGNORE INTO inspectnumseq (prefix, digits, nextnum)
SELECT 'INS-', 6, COALESCE(MAX(CAST(SUBSTRING(inspectnum, 5) AS UNSIGNED)), 0) + 1
FROM inspecttable
WHERE inspectnum LIKE 'INS-%';
