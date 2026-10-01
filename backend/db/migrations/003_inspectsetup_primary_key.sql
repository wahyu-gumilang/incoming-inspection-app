-- One row per "Checked by" name; ids are generated from now on.
ALTER TABLE inspectsetup
  MODIFY id int(11) NOT NULL AUTO_INCREMENT,
  ADD PRIMARY KEY (id);
