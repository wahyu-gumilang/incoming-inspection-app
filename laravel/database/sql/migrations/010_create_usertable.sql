-- Application users (PLAN.md §2.0). fullname is varchar(50) because it is copied
-- into inspecttable.inspectby / checkedby, which are varchar(50). Users are
-- deactivated, never deleted, so names on past inspections stay valid.
-- The legacy oauth_users table belongs to an unrelated app and is not used.
CREATE TABLE IF NOT EXISTS usertable (
  userid int(11) NOT NULL AUTO_INCREMENT,
  username varchar(50) NOT NULL,
  fullname varchar(50) NOT NULL,
  email varchar(100) NULL DEFAULT NULL,
  role varchar(20) NOT NULL,
  password_hash varchar(100) NOT NULL,
  active tinyint(1) NOT NULL DEFAULT 1,
  must_change_password tinyint(1) NOT NULL DEFAULT 0,
  theme varchar(10) NOT NULL DEFAULT 'light',
  last_login_at datetime NULL DEFAULT NULL,
  created_at datetime NOT NULL DEFAULT current_timestamp(),
  updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (userid),
  UNIQUE KEY uq_usertable_username (username),
  CONSTRAINT chk_usertable_role CHECK (role IN ('INSPECTOR', 'CHECKER', 'ADMIN')),
  CONSTRAINT chk_usertable_theme CHECK (theme IN ('light', 'dark', 'system'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
