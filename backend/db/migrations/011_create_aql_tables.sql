-- AQL sampling plans (PLAN.md §2.3, requested by Pak Fajar). A plan's rows give,
-- per inspection category and lot-size range, the sample size and the accept (Ac)
-- and reject (Re) numbers. inspectcategory uses the inspecttable codes:
-- 1 = Normal, 2 = Reduced, 3 = Tightened (0 = 100 % inspection has no rows).
-- Lots below the first row, and lots smaller than the sample, are inspected 100 %.
CREATE TABLE IF NOT EXISTS aqlplan (
  planid int(11) NOT NULL AUTO_INCREMENT,
  name varchar(100) NOT NULL,
  inspectlevel varchar(10) NOT NULL,
  aql varchar(20) NOT NULL,
  isdefault tinyint(1) NOT NULL DEFAULT 0,
  note varchar(255) NULL DEFAULT NULL,
  updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (planid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS aqlplanrow (
  planid int(11) NOT NULL,
  inspectcategory int(11) NOT NULL,
  lotmin int(11) NOT NULL,
  lotmax int(11) NULL DEFAULT NULL,
  codeletter varchar(2) NOT NULL,
  samplesize int(11) NOT NULL,
  acceptnum int(11) NOT NULL,
  rejectnum int(11) NOT NULL,
  PRIMARY KEY (planid, inspectcategory, lotmin),
  CONSTRAINT fk_aqlplanrow_plan FOREIGN KEY (planid) REFERENCES aqlplan (planid) ON DELETE CASCADE,
  CONSTRAINT chk_aqlplanrow_category CHECK (inspectcategory IN (1, 2, 3)),
  CONSTRAINT chk_aqlplanrow_lot CHECK (lotmin >= 1 AND (lotmax IS NULL OR lotmax >= lotmin)),
  CONSTRAINT chk_aqlplanrow_numbers CHECK (samplesize >= 1 AND acceptnum >= 0 AND rejectnum > acceptnum)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Provisional plans of 2026-10-01 (PLAN.md Q12–Q14). Fixed ids keep this re-runnable.
INSERT IGNORE INTO aqlplan (planid, name, inspectlevel, aql, isdefault, note) VALUES
(1, 'Current practice', 'S-1', 'Ac 0', 1,
 'ISO 2859-1 Special Level S-1, zero defects. Matches the filled check sheet (lot 20 and 50: 2 pcs, lot 100: 3 pcs). T = one code letter up, R = one down: to confirm with QC.'),
(2, 'ISO General Level II, AQL 2.5', 'II', '2.5', 0,
 'From Pak Fajar''s request. Normal only, ISO arrows resolved. Verify against the official standard before use.');

-- Plan 1: S-1 code letters A (2–50), B (51–500), C (501–35 000), D (35 001+).
INSERT IGNORE INTO aqlplanrow (planid, inspectcategory, lotmin, lotmax, codeletter, samplesize, acceptnum, rejectnum) VALUES
(1, 1, 2, 50, 'A', 2, 0, 1),
(1, 1, 51, 500, 'B', 3, 0, 1),
(1, 1, 501, 35000, 'C', 5, 0, 1),
(1, 1, 35001, NULL, 'D', 8, 0, 1),
(1, 3, 2, 50, 'B', 3, 0, 1),
(1, 3, 51, 500, 'C', 5, 0, 1),
(1, 3, 501, 35000, 'D', 8, 0, 1),
(1, 3, 35001, NULL, 'E', 13, 0, 1),
(1, 2, 2, 50, 'A', 2, 0, 1),
(1, 2, 51, 500, 'A', 2, 0, 1),
(1, 2, 501, 35000, 'B', 3, 0, 1),
(1, 2, 35001, NULL, 'C', 5, 0, 1);

-- Plan 2: General Level II, AQL 2.5, normal inspection.
INSERT IGNORE INTO aqlplanrow (planid, inspectcategory, lotmin, lotmax, codeletter, samplesize, acceptnum, rejectnum) VALUES
(2, 1, 2, 50, 'C', 5, 0, 1),
(2, 1, 51, 150, 'F', 20, 1, 2),
(2, 1, 151, 280, 'G', 32, 2, 3),
(2, 1, 281, 500, 'H', 50, 3, 4),
(2, 1, 501, 1200, 'J', 80, 5, 6),
(2, 1, 1201, 3200, 'K', 125, 7, 8),
(2, 1, 3201, 10000, 'L', 200, 10, 11),
(2, 1, 10001, 35000, 'M', 315, 14, 15),
(2, 1, 35001, NULL, 'N', 500, 21, 22);
