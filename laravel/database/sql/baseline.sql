-- Schema of `csi_db` as imported (before any migration). Base for csi_db_test; never edit.
-- Structure only: no rows. Unrelated legacy tables are excluded.

CREATE TABLE `inspectline` (
  `inspectnum` varchar(30) NOT NULL,
  `linenum` int(11) NOT NULL,
  `inspectitem` varchar(100) DEFAULT NULL,
  `standard` decimal(18,2) DEFAULT NULL,
  `tolerance` decimal(18,2) DEFAULT 0.00,
  `actual_1` decimal(18,2) DEFAULT 0.00,
  `actual_2` decimal(18,2) DEFAULT 0.00,
  `actual_3` decimal(18,2) DEFAULT 0.00,
  `actual_4` decimal(18,2) DEFAULT 0.00,
  `actual_5` decimal(18,2) DEFAULT 0.00,
  `actual_6` decimal(18,2) DEFAULT 0.00,
  `actual_7` decimal(18,2) DEFAULT 0.00,
  `status_1` int(11) DEFAULT 0,
  `status_2` int(11) DEFAULT 0,
  `status_3` int(11) DEFAULT 0,
  `status_4` int(11) DEFAULT 0,
  `status_5` int(11) DEFAULT 0,
  `status_6` int(11) DEFAULT 0,
  `status_7` int(11) DEFAULT 0,
  PRIMARY KEY (`inspectnum`,`linenum`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `inspectlineother` (
  `inspectnum` varchar(30) NOT NULL,
  `linenum` int(11) NOT NULL,
  `inspecttype` varchar(30) DEFAULT NULL,
  `inspectitem` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `inspectsetup` (
  `id` int(11) NOT NULL,
  `checkedby` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `inspecttable` (
  `inspectnum` varchar(30) NOT NULL,
  `inspectdate` date DEFAULT NULL,
  `itemid` varchar(30) DEFAULT NULL,
  `itemname` varchar(100) DEFAULT NULL,
  `accountnum` varchar(30) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `inspectstatus` varchar(30) DEFAULT NULL,
  `purchordernum1` varchar(30) DEFAULT NULL,
  `purchordernum2` varchar(30) DEFAULT NULL,
  `purchordernum3` varchar(30) DEFAULT NULL,
  `purchordernum4` varchar(30) DEFAULT NULL,
  `purchordernum5` varchar(30) DEFAULT NULL,
  `purchordernum6` varchar(30) DEFAULT NULL,
  `purchordernum7` varchar(30) DEFAULT NULL,
  `deliverydate1` date DEFAULT current_timestamp(),
  `deliverydate2` date DEFAULT current_timestamp(),
  `deliverydate3` date DEFAULT current_timestamp(),
  `deliverydate4` date DEFAULT current_timestamp(),
  `deliverydate5` date DEFAULT current_timestamp(),
  `deliverydate6` date DEFAULT current_timestamp(),
  `deliverydate7` date DEFAULT current_timestamp(),
  `qty_received1` decimal(18,2) DEFAULT 0.00,
  `qty_received2` decimal(18,2) DEFAULT 0.00,
  `qty_received3` decimal(18,2) DEFAULT 0.00,
  `qty_received4` decimal(18,2) DEFAULT 0.00,
  `qty_received5` decimal(18,2) DEFAULT 0.00,
  `qty_received6` decimal(18,2) DEFAULT 0.00,
  `qty_received7` decimal(18,2) DEFAULT 0.00,
  `inspectcategory1` int(11) DEFAULT 0,
  `inspectcategory2` int(11) DEFAULT 0,
  `inspectcategory3` int(11) DEFAULT 0,
  `inspectcategory4` int(11) DEFAULT 0,
  `inspectcategory5` int(11) DEFAULT 0,
  `inspectcategory6` int(11) DEFAULT 0,
  `inspectcategory7` int(11) DEFAULT 0,
  `notgood1` int(11) DEFAULT 0,
  `notgood2` int(11) DEFAULT 0,
  `notgood3` int(11) DEFAULT 0,
  `notgood4` int(11) DEFAULT 0,
  `notgood5` int(11) DEFAULT 0,
  `notgood6` int(11) DEFAULT 0,
  `notgood7` int(11) DEFAULT 0,
  `judgment1` int(11) DEFAULT 0,
  `judgment2` int(11) DEFAULT 0,
  `judgment3` int(11) DEFAULT 0,
  `judgment4` int(11) DEFAULT 0,
  `judgment5` int(11) DEFAULT 0,
  `judgment6` int(11) DEFAULT 0,
  `judgment7` int(11) DEFAULT 0,
  `qfnum` varchar(50) DEFAULT NULL,
  `inspectby` varchar(50) DEFAULT NULL,
  `checkedby` varchar(50) DEFAULT NULL,
  `recid` double DEFAULT NULL,
  PRIMARY KEY (`inspectnum`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `inventinspectitem` (
  `itemid` varchar(30) NOT NULL,
  `itemname` varchar(100) DEFAULT NULL,
  `inspecttype` varchar(50) NOT NULL,
  `inspectitem` varchar(100) NOT NULL,
  `standard_txt` varchar(100) DEFAULT NULL,
  `standard` decimal(18,2) DEFAULT NULL,
  `tolerance` varchar(50) DEFAULT NULL,
  `tolerance_plus` decimal(19,2) DEFAULT 0.00,
  `tolerance_minus` decimal(19,2) DEFAULT 0.00,
  PRIMARY KEY (`itemid`,`inspecttype`,`inspectitem`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `inventtable` (
  `itemid` varchar(30) NOT NULL,
  `name` varchar(100) NOT NULL,
  `inspectqty` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `vendtable` (
  `vendaccount` varchar(30) NOT NULL,
  `name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
